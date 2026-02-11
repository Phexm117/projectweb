ข้อมูลผู้พัฒนา 
ชื่อโปรเจค โปรเจคเว็ปไซต์เพื่อการหาบ้านให้สุนัขและแมวที่ถูกทอดทิ้ง 
(A Website for Finding Homes for Abandoned Dogs and Cat)

รายชื่อสมาชิก                               
67021545 นายเจษฎา อุบาลี     - ทำรายงาน บทที่ 1,3,4,5   (Frontend)
67021602 นางสาวชวิศา ครองดี   - ทำรายงาน บทที่ 2 ออกแบบแผนผัง Sitemap   (Frontend)
67022254 นางสาวศุภาพิชญ์ อดทน  -  ออกแบบต้นเเบบหน้าเว็ปไซต์ ออกแบบ Sitemap  (Backend)
67022445 นางสาวอัญสุดา ทองดง  -  ทำรายงานบทที่ 2 ออกแบบ Sitemap   (Frontend)
67026203 นายกิตศักดิ์ มีมา - ออกแบบต้นแบบหน้าเว็ปไวต์  ออกแบบโครสร้างฐานข้อมูล Database Schma ทำ Database   ทำFrontend

ขั้นตอนการติดตั้ง
1️.ติดตั้ง Node.js
2.ติดตั้ง XAMPP (สำหรับ MySQL / MariaDB)
3.ติดตั้ง Git

ขั้นตอนการดาวน์โหลดโปรเจค
Clone โปรเจคจาก GitHub
ใช้คำสั่ง git clone https://github.com/Phexm117/projectweb.git

ขั้นตอนการติดตั้ง Library ผ่าน npm
รันคำสั่ง: npm install 

ขั้นตอนการ Import ฐานข้อมูล
1.สร้างฐานข้อมูลใหม่ เช่น hospital_db
2.ไปที่เมนู Import 
3.เลือกไฟล์ .sql ที่อยู่ในโฟลเดอร์ projectweb\db
4.กด Import
5.ตั้งค่าเชื่อมต่อฐานข้อมูล เปิดไฟล์ .env และแก้ไขค่าให้ตรงกับเครื่องของตนเอง 

ขั้นตอนการรันโปรเจค
รันด้วยคำสั่ง: npm run dev 
เมื่อรันสำเร็จ จะขึ้นข้อความเช่น:
Server running at http://localhost:3000

การใช้งาน
role Admin 
email:admin@example.com
password:1234
