# สรุปไฟล์สำคัญ (คู่มือแก้ไขเร็ว)

## หน้าและไฟล์หลัก
- หน้า Landing (ผู้ใช้ทั่วไป): views/user/landing.ejs
- หน้า ค้นหา/หน้าแรกผู้ใช้: views/user/user_home.ejs
- หน้า รายการแนะนำ: views/user/recommended.ejs
- หน้า รายการโปรด: views/user/favorites.ejs
- หน้า รายละเอียดสัตว์: views/user/pet-detail.ejs
- พาร์เชียลการ์ดสัตว์: views/partials/pet-card.ejs
- พาร์เชียลโมดัลสัตว์ (ใช้ซ้ำ): views/partials/pet-modal.ejs

## การดึงข้อมูลสัตว์
- ดึงรายการ: services/pets-service.js -> fetchPetsForUser()
- ดึงรายละเอียด: services/pets-service.js -> fetchPetById()
- รายการโปรด: services/user-service.js
- ตัวควบคุม: controllers/user-controller.js

## การนับวิวเมื่อกดการ์ด
- API: POST /pets/:id/view
- Handler: controllers/user-controller.js -> incrementView()
- Trigger: เปิดโมดัล (shown.bs.modal) ใน user_home/recommended/favorites

## การกดหัวใจ (Favorite)
- API: POST /favorites/toggle
- Handler: controllers/user-controller.js -> toggleFavorite()
- UI: ไอคอนหัวใจบนการ์ด/โมดัล

## โมดัลสัตว์ (ใช้ไฟล์เดียว)
- แหล่งหลัก: views/partials/pet-modal.ejs
- ถูกเรียกใช้ใน: user_home/recommended/favorites และ pet-card

## เคล็ดลัดแก้เร็ว
- ปรับหน้าตาโมดัล: แก้ที่ views/partials/pet-modal.ejs เท่านั้น
- ปรับฟิลด์รายการสัตว์: แก้ที่ services/pets-service.js
- ปรับฟิลด์รายการโปรด: แก้ที่ services/user-service.js
- ปรับหน้า Landing: แก้ที่ views/user/landing.ejs

## CSS ต้องแก้ตรงไหน
- สไตล์หลักของเว็บ: public/style.css
- ปรับสี/ปุ่ม/การ์ดรวม: public/style.css (คลาสเช่น .pet-card, .badge-small, .navbar, .landing-btn)
- ถ้าแก้หน้าตาโมดัลแบบรวดเร็ว: แก้ inline style ใน views/partials/pet-modal.ejs

## วิธีให้เพื่อนโหลด DB ของโปรเจกต์
- ใช้ไฟล์: db/database.sql
- ขั้นตอน (MySQL/MariaDB):
	1) เปิดเครื่องมือฐานข้อมูล (เช่น MySQL Workbench/HeidiSQL)
	2) สร้างฐานชื่อ `projectweb` (หรือปล่อยให้สคริปต์สร้างเอง)
	3) รันไฟล์ db/database.sql เพื่อสร้างตาราง + ข้อมูลตัวอย่าง
- ตั้งค่าไฟล์ .env ให้ตรงกับเครื่องเพื่อน (HOST/USER/PASSWORD/DB)

## หลังโคลนโปรเจกต์ต้องทำอะไรบ้าง
1) ติดตั้งแพ็กเกจ
	- รัน: npm install
2) ตั้งค่าไฟล์ .env
	- ใส่ค่าเชื่อมต่อ DB ให้ตรงกับเครื่องเพื่อน
3) นำเข้า DB
	- ใช้ไฟล์: db/database.sql
4) รันโปรเจกต์
	- npm start (หรือ npm run dev)
5) เปิดเว็บ
	- http://localhost:3000
