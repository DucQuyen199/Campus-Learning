// Hãy viết code của bạn ở đây

#include <iostream>
#include <cmath>  // Thư viện cho hàm sqrt
using namespace std;

int main() {
    double a, b, c;
    cout << "Nhap he so a, b, c: ";
    cin >> a >> b >> c;

    if (a == 0) {
        // Phương trình trở thành bậc nhất: bx + c = 0
        if (b == 0) {
            if (c == 0) {
                cout << "Phuong trinh vo so nghiem." << endl;
            } else {
                cout << "Phuong trinh vo nghiem." << endl;
            }
        } else {
            double x = -c / b;
            cout << "Phuong trinh co mot nghiem: x = " << x << endl;
        }
    } else {
        double delta = b * b - 4 * a * c;

        if (delta > 0) {
            double x1 = (-b + sqrt(delta)) / (2 * a);
            double x2 = (-b - sqrt(delta)) / (2 * a);
            cout << "Phuong trinh co 2 nghiem phan biet:" << endl;
            cout << "x1 = " << x1 << ", x2 = " << x2 << endl;
        } else if (delta == 0) {
            double x = -b / (2 * a);
            cout << "Phuong trinh co nghiem kep: x = " << x << endl;
        } else {
            cout << "Phuong trinh vo nghiem (nghiem phuc)." << endl;
        }
    }

    return 0;
}
