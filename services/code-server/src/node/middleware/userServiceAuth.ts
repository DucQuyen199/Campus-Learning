import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export const authenticateUserServiceToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization as string | undefined
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: Missing or invalid token' })
    return
  }
  const token = authHeader.substring(7)
  try {
    const secret = process.env.USER_SERVICE_JWT_SECRET
    if (!secret) {
      throw new Error('USER_SERVICE_JWT_SECRET is not set')
    }
    const decoded = jwt.verify(token, secret)
    ;(req as any).userServiceUser = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' })
  }
} 