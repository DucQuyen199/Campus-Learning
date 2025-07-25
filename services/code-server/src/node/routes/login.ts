import { Router, Request } from "express"
import { promises as fs } from "fs"
import { RateLimiter as Limiter } from "limiter"
import * as path from "path"
import { CookieKeys } from "../../common/http"
import { rootPath } from "../constants"
import { authenticated, getCookieOptions, redirect, replaceTemplates } from "../http"
import i18n from "../i18n"
import { getPasswordMethod, handlePasswordValidation, sanitizeString, escapeHtml } from "../util"
import axios from 'axios'

// RateLimiter wraps around the limiter library for logins.
// It allows 2 logins every minute plus 12 logins every hour.
export class RateLimiter {
  private readonly minuteLimiter = new Limiter({ tokensPerInterval: 2, interval: "minute" })
  private readonly hourLimiter = new Limiter({ tokensPerInterval: 12, interval: "hour" })

  public canTry(): boolean {
    // Note: we must check using >= 1 because technically when there are no tokens left
    // you get back a number like 0.00013333333333333334
    // which would cause fail if the logic were > 0
    return this.minuteLimiter.getTokensRemaining() >= 1 || this.hourLimiter.getTokensRemaining() >= 1
  }

  public removeToken(): boolean {
    return this.minuteLimiter.tryRemoveTokens(1) || this.hourLimiter.tryRemoveTokens(1)
  }
}

const getRoot = async (req: Request, error?: Error): Promise<string> => {
  const content = await fs.readFile(path.join(rootPath, "src/browser/pages/login.html"), "utf8")
  const locale = req.args["locale"] || "en"
  i18n.changeLanguage(locale)
  const appName = req.args["app-name"] || "code-server"
  const welcomeText = req.args["welcome-text"] || (i18n.t("WELCOME", { app: appName }) as string)
  let passwordMsg = i18n.t("LOGIN_PASSWORD", { configFile: req.args.config })
  if (req.args.usingEnvPassword) {
    passwordMsg = i18n.t("LOGIN_USING_ENV_PASSWORD")
  } else if (req.args.usingEnvHashedPassword) {
    passwordMsg = i18n.t("LOGIN_USING_HASHED_PASSWORD")
  }

  return replaceTemplates(
    req,
    content
      .replace(/{{I18N_LOGIN_TITLE}}/g, i18n.t("LOGIN_TITLE", { app: appName }))
      .replace(/{{WELCOME_TEXT}}/g, welcomeText)
      .replace(/{{PASSWORD_MSG}}/g, passwordMsg)
      .replace(/{{I18N_LOGIN_BELOW}}/g, i18n.t("LOGIN_BELOW"))
      .replace(/{{I18N_PASSWORD_PLACEHOLDER}}/g, i18n.t("PASSWORD_PLACEHOLDER"))
      .replace(/{{I18N_SUBMIT}}/g, i18n.t("SUBMIT"))
      .replace(/{{ERROR}}/, error ? `<div class="error">${escapeHtml(error.message)}</div>` : ""),
  )
}

const limiter = new RateLimiter()

export const router = Router()

router.use(async (req, res, next) => {
  const to = (typeof req.query.to === "string" && req.query.to) || "/"
  if (await authenticated(req)) {
    return redirect(req, res, to, { to: undefined })
  }
  next()
})

router.get("/", async (req, res) => {
  res.send(await getRoot(req))
})

router.post<{}, string, { password?: string; base?: string } | undefined, { to?: string }>("/", async (req, res) => {
  const username = sanitizeString(req.body?.username)
  const password = sanitizeString(req.body?.password)

  try {
    // Rate limiting for login attempts
    if (!limiter.canTry()) {
      throw new Error(i18n.t("LOGIN_RATE_LIMIT") as string)
    }

    if (!username) {
      throw new Error("Username is required")
    }

    if (!password) {
      throw new Error(i18n.t("MISS_PASSWORD") as string)
    }

    // Authenticate against user-service
    const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:5001"
    const loginResponse = await axios.post(`${userServiceUrl}/api/auth/login`, { username, password })
    const data = loginResponse.data
    if (data.success) {
      // Use returned JWT token as session cookie
      const token = data.tokens?.accessToken || data.token
      res.cookie(CookieKeys.Session, token, getCookieOptions(req))

      const to = (typeof req.query.to === "string" && req.query.to) || "/"
      return redirect(req, res, to, { to: undefined })
    }

    // Remove token for failed login
    limiter.removeToken()
    throw new Error(data.error || data.message || "Login failed")
  } catch (error: any) {
    limiter.removeToken()
    const renderedHtml = await getRoot(req, error)
    res.send(renderedHtml)
  }
})
