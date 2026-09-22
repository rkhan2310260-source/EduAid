-- =============================================================
--  EduAid Bangladesh Mockup Data  (schema-accurate version)
--  Run AFTER Spring Boot has started at least once.
--  All user passwords = "Password@123"
-- =============================================================

USE eduaid;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE messages;
TRUNCATE TABLE conversation_participants;
TRUNCATE TABLE conversations;
TRUNCATE TABLE ngo_student_donations;
TRUNCATE TABLE ngo_project_donations;
TRUNCATE TABLE ngo_project_requests;
TRUNCATE TABLE fund_transparency;
TRUNCATE TABLE fund_utilization;
TRUNCATE TABLE donations;
TRUNCATE TABLE payment_transactions;
TRUNCATE TABLE project_updates;
TRUNCATE TABLE school_projects;
TRUNCATE TABLE dropout_predictions;
TRUNCATE TABLE students;
TRUNCATE TABLE school_documents;
TRUNCATE TABLE ngo_gamification;
TRUNCATE TABLE donor_gamification;
TRUNCATE TABLE ngo_projects;
TRUNCATE TABLE ngos;
TRUNCATE TABLE donors;
TRUNCATE TABLE schools;
TRUNCATE TABLE user_profiles;
TRUNCATE TABLE users;
TRUNCATE TABLE upazilas;
TRUNCATE TABLE districts;
TRUNCATE TABLE divisions;
TRUNCATE TABLE project_types;
TRUNCATE TABLE system_metrics;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- 1. DIVISIONS
-- =============================================================
INSERT INTO divisions (division_id, division_name, division_code) VALUES
(1,'Dhaka','DHK'),(2,'Chattogram','CTG'),(3,'Rajshahi','RAJ'),
(4,'Khulna','KHL'),(5,'Barishal','BAR'),(6,'Sylhet','SYL'),
(7,'Mymensingh','MYM'),(8,'Rangpur','RAN');

-- =============================================================
-- 2. DISTRICTS
-- =============================================================
INSERT INTO districts (district_id, district_name, district_code, division_id) VALUES
(1,'Dhaka','DHK-01',1),(2,'Gazipur','DHK-02',1),(3,'Narayanganj','DHK-03',1),
(4,'Chattogram','CTG-01',2),(5,'Coxs Bazar','CTG-02',2),
(6,'Rajshahi','RAJ-01',3),(7,'Natore','RAJ-02',3),
(8,'Khulna','KHL-01',4),(9,'Jessore','KHL-02',4),
(10,'Barishal','BAR-01',5),(11,'Sylhet','SYL-01',6),
(12,'Mymensingh','MYM-01',7),(13,'Rangpur','RAN-01',8);

-- =============================================================
-- 3. UPAZILAS
-- =============================================================
INSERT INTO upazilas (upazila_id, upazila_name, upazila_code, district_id) VALUES
(1,'Mirpur','DHK-01-01',1),(2,'Uttara','DHK-01-02',1),(3,'Demra','DHK-01-03',1),
(4,'Tongi','DHK-02-01',2),(5,'Kaliakoir','DHK-02-02',2),(6,'Rupganj','DHK-03-01',3),
(7,'Sitakunda','CTG-01-01',4),(8,'Hathazari','CTG-01-02',4),
(9,'Coxs Bazar Sadar','CTG-02-01',5),(10,'Rajshahi Sadar','RAJ-01-01',6),
(11,'Natore Sadar','RAJ-02-01',7),(12,'Khulna Sadar','KHL-01-01',8),
(13,'Jessore Sadar','KHL-02-01',9),(14,'Barishal Sadar','BAR-01-01',10),
(15,'Sylhet Sadar','SYL-01-01',11),(16,'Mymensingh Sadar','MYM-01-01',12),
(17,'Rangpur Sadar','RAN-01-01',13);

-- =============================================================
-- 4. PROJECT TYPES
-- =============================================================
INSERT INTO project_types (project_type_id, type_name, type_code, type_description, is_active) VALUES
(1,'Scholarship Program','SCHOLARSHIP','Financial assistance for meritorious and underprivileged students',1),
(2,'Infrastructure','INFRA','Construction and renovation of school buildings and facilities',1),
(3,'Digital Education','DIGITAL','Provision of computers, tablets and internet connectivity',1),
(4,'Teacher Training','TRAINING','Professional development programs for school teachers',1),
(5,'Nutrition and Health','HEALTH','Mid-day meal and health checkup programs for students',1),
(6,'Flood Relief Education','FLOOD','Emergency education support for flood-affected communities',1),
(7,'Girls Education','GIRLS','Programs to promote girls enrolment and retention in schools',1),
(8,'Library and Books','LIBRARY','Donation of books, stationery and establishment of libraries',1);

-- =============================================================
-- 5. USERS  (password = "Password@123" BCrypt)
-- =============================================================
INSERT INTO users (user_id, email, username, password_hash, is_active, user_type, created_at, updated_at) VALUES
(1, 'jahangirnagar.school@eduaid.bd','jn_school',     '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'SCHOOL',NOW(),NOW()),
(2, 'shaheen.school@eduaid.bd',      'shaheen_school','$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'SCHOOL',NOW(),NOW()),
(3, 'khulnamodel.school@eduaid.bd',  'khulna_model',  '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'SCHOOL',NOW(),NOW()),
(4, 'coxsbazar.school@eduaid.bd',    'coxsbazar_sch', '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'SCHOOL',NOW(),NOW()),
(5, 'rajshahimadrasa@eduaid.bd',     'raj_madrasa',   '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'SCHOOL',NOW(),NOW()),
(6, 'karim.rahman@gmail.com',        'karim_rahman',  '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'DONOR', NOW(),NOW()),
(7, 'nasrin.begum@yahoo.com',        'nasrin_begum',  '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'DONOR', NOW(),NOW()),
(8, 'rahim.uddin@hotmail.com',       'rahim_uddin',   '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'DONOR', NOW(),NOW()),
(9, 'fatema.khanam@gmail.com',       'fatema_khanam', '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'DONOR', NOW(),NOW()),
(10,'shahadat.hossain@gmail.com',    'shahadat_h',    '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'DONOR', NOW(),NOW()),
(11,'brac.bd@eduaid.bd',             'brac_bd',       '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'NGO',   NOW(),NOW()),
(12,'ashadeep.ngo@eduaid.bd',        'ashadeep_ngo',  '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'NGO',   NOW(),NOW()),
(13,'protigga.ngo@eduaid.bd',        'protigga_ngo',  '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'NGO',   NOW(),NOW()),
(14,'shikkha.ngo@eduaid.bd',         'shikkha_ngo',   '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'NGO',   NOW(),NOW()),
(15,'admin@eduaid.bd',               'super_admin',   '$2a$10$q33zNsp4CbZw6WyaBB0U8uc/IfSgT4wZl4mwYHBC5TuNi0lLcxh2G',1,'ADMIN', NOW(),NOW());

-- =============================================================
-- 6. USER PROFILES
-- =============================================================
INSERT INTO user_profiles (profile_id,user_id,full_name,phone,address,status,profile_image_url,last_login,created_at,updated_at) VALUES
(1, 1, 'Jahangir Nagar School Admin','01711-234567','Mirpur-11, Dhaka',         'ACTIVE',NULL,NOW(),NOW(),NOW()),
(2, 2, 'Shaheen School Admin',       '01819-345678','Gazipur Sadar, Gazipur',   'ACTIVE',NULL,NOW(),NOW(),NOW()),
(3, 3, 'Khulna Model School Admin',  '01916-456789','Khulna Sadar, Khulna',     'ACTIVE',NULL,NOW(),NOW(),NOW()),
(4, 4, 'Coxs Bazar School Admin',    '01514-567890','Coxs Bazar Sadar',         'ACTIVE',NULL,NOW(),NOW(),NOW()),
(5, 5, 'Rajshahi Madrasa Admin',     '01611-678901','Natore Sadar, Natore',     'ACTIVE',NULL,NOW(),NOW(),NOW()),
(6, 6, 'Karim Rahman',              '01755-111222','Gulshan-2, Dhaka',          'ACTIVE',NULL,NOW(),NOW(),NOW()),
(7, 7, 'Nasrin Begum',              '01844-222333','Dhanmondi-27, Dhaka',       'ACTIVE',NULL,NOW(),NOW(),NOW()),
(8, 8, 'Rahim Uddin',               '01933-333444','Agrabad, Chattogram',       'ACTIVE',NULL,NOW(),NOW(),NOW()),
(9, 9, 'Fatema Khanam',             '01522-444555','Lalmatia, Dhaka',           'ACTIVE',NULL,NOW(),NOW(),NOW()),
(10,10, 'Shahadat Hossain',         '01677-555666','Uttara, Dhaka',             'ACTIVE',NULL,NOW(),NOW(),NOW()),
(11,11, 'BRAC Bangladesh Contact',  '01799-666777','BRAC Centre, Mohakhali, Dhaka','ACTIVE',NULL,NOW(),NOW(),NOW()),
(12,12, 'Ashadeep NGO Admin',       '01888-777888','Sylhet Sadar',              'ACTIVE',NULL,NOW(),NOW(),NOW()),
(13,13, 'Protigga NGO Admin',       '01977-888999','Rajshahi Sadar',            'ACTIVE',NULL,NOW(),NOW(),NOW()),
(14,14, 'Shikkha Foundation Admin', '01566-999000','Barishal Sadar',            'ACTIVE',NULL,NOW(),NOW(),NOW()),
(15,15, 'EduAid Super Admin',       '01700-000001','Dhaka HQ',                  'ACTIVE',NULL,NOW(),NOW(),NOW());

-- =============================================================
-- 7. SCHOOLS
-- =============================================================
INSERT INTO schools (school_id,user_id,school_name,registration_number,school_type,address,division_id,district_id,upazila_id,latitude,longitude,verification_status,status,school_image,created_at,updated_at) VALUES
(1,1,'Jahangir Nagar Government Primary School','REG-DHK-2010-0012','PRIMARY',   'Mirpur-11, Dhaka-1216',       1,1,1, 23.82310000,90.35820000,'VERIFIED','ACTIVE', NULL,NOW(),NOW()),
(2,2,'Shaheen Secondary School and College',    'REG-GAZ-2005-0034','HIGH_SCHOOL','Tongi, Gazipur-1710',        1,2,4, 24.00190000,90.40180000,'VERIFIED','ACTIVE', NULL,NOW(),NOW()),
(3,3,'Khulna Model Government High School',     'REG-KHL-2000-0056','SECONDARY', 'Khulna Sadar, Khulna-9100',  4,8,12,22.84560000,89.54020000,'VERIFIED','ACTIVE', NULL,NOW(),NOW()),
(4,4,'Coxs Bazar Government Primary School',    'REG-CTG-2015-0078','PRIMARY',   'Coxs Bazar Sadar-4700',      2,5,9, 21.44170000,91.97820000,'PENDING', 'ACTIVE', NULL,NOW(),NOW()),
(5,5,'Natore Islamia Dakhil Madrasa',           'REG-RAJ-2008-0090','MADRASA',   'Natore Sadar, Natore-6400',  3,7,11,24.41040000,89.00030000,'VERIFIED','AT_RISK',NULL,NOW(),NOW());

-- =============================================================
-- 8. DONORS
-- =============================================================
INSERT INTO donors (donor_id,user_id,donor_name,tax_id,is_anonymous,donor_image,created_at,updated_at) VALUES
(1,6, 'Karim Rahman',    'TIN-2024-101234',0,NULL,NOW(),NOW()),
(2,7, 'Nasrin Begum',    'TIN-2024-202345',0,NULL,NOW(),NOW()),
(3,8, 'Rahim Uddin',     'TIN-2024-303456',0,NULL,NOW(),NOW()),
(4,9, 'Fatema Khanam',   NULL,             1,NULL,NOW(),NOW()),
(5,10,'Shahadat Hossain','TIN-2024-404567',0,NULL,NOW(),NOW());

-- =============================================================
-- 9. NGOs
-- =============================================================
INSERT INTO ngos (ngo_id,user_id,ngo_name,registration_number,description,contact_person,contact_phone,verification_status,verified_at,created_at,updated_at) VALUES
(1,11,'BRAC Bangladesh Education Wing','NGO-REG-1972-BRAC',
 'BRAC is one of the worlds largest development organisations dedicated to empowering people living in poverty through healthcare, education and economic empowerment in Bangladesh.',
 'Md. Asif Hossain','01799-666777','VERIFIED','2024-01-15 10:00:00',NOW(),NOW()),
(2,12,'Ashadeep Foundation','NGO-REG-2005-ASHD',
 'Ashadeep Foundation works in Sylhet to provide quality education to underprivileged children from tea-garden communities and ethnic minority groups.',
 'Reshma Akter','01888-777888','VERIFIED','2024-02-20 11:00:00',NOW(),NOW()),
(3,13,'Protigga Bangladesh','NGO-REG-2010-PRTG',
 'Protigga Bangladesh focuses on dropout prevention and girls education in northern Bangladesh operating in Rajshahi and Rangpur through community engagement programs.',
 'Tariqul Islam','01977-888999','VERIFIED','2024-03-10 09:00:00',NOW(),NOW()),
(4,14,'Shikkha O Unnayan Foundation','NGO-REG-2015-SHKF',
 'Shikkha O Unnayan Foundation provides educational support to coastal belt children in Barishal division affected by cyclones and river erosion.',
 'Momotaz Begum','01566-999000','PENDING',NULL,NOW(),NOW());

-- =============================================================
-- 10. STUDENTS
-- =============================================================
INSERT INTO students (student_id,school_id,student_name,student_id_number,gender,date_of_birth,father_name,father_alive,father_occupation,mother_name,mother_alive,mother_occupation,guardian_phone,address,class_level,family_monthly_income,has_scholarship,profile_image,created_at,updated_at) VALUES
(1, 1,'Rubel Hossain',    'STU-JN-2024-001','MALE',  '2015-03-12','Abul Hossain',  1,'Rickshaw Puller', 'Sufia Begum',  1,'Housewife',      '01712-001001','Mirpur-11, Dhaka',  'THREE',5500.00, 0,NULL,NOW(),NOW()),
(2, 1,'Sadia Akter',      'STU-JN-2024-002','FEMALE','2014-07-22','Jalal Uddin',   1,'Day Labourer',    'Rahela Khanam',1,'Garments Worker','01812-002002','Mirpur-12, Dhaka',  'FOUR', 6200.00, 1,NULL,NOW(),NOW()),
(3, 1,'Md. Rasel Mia',    'STU-JN-2024-003','MALE',  '2013-11-05','Hafizur Rahman',0,'Deceased',        'Hasna Begum',  1,'Maid Servant',   '01912-003003','Mirpur-13, Dhaka',  'FIVE', 3200.00, 1,NULL,NOW(),NOW()),
(4, 1,'Sumaia Khatun',    'STU-JN-2024-004','FEMALE','2016-02-18','Kamal Hossain', 1,'Shop Owner',      'Bilkis Begum', 1,'Housewife',      '01512-004004','Pallabi, Dhaka',    'TWO',  8000.00, 0,NULL,NOW(),NOW()),
(5, 2,'Tanvir Ahmed',     'STU-SH-2024-001','MALE',  '2010-05-30','Nurul Islam',   1,'Farmer',          'Rohima Begum', 1,'Housewife',      '01612-005005','Tongi, Gazipur',    'EIGHT',9500.00, 0,NULL,NOW(),NOW()),
(6, 2,'Sumaiya Sultana',  'STU-SH-2024-002','FEMALE','2011-09-14','Shamsul Haque', 1,'Welder',          'Roksana Begum',1,'Garments Worker','01712-006006','Kaliakoir, Gazipur','SEVEN',11000.00,1,NULL,NOW(),NOW()),
(7, 2,'Nahid Hassan',     'STU-SH-2024-003','MALE',  '2009-12-25','Badrul Islam',  1,'Guard',           'Monwara Begum',0,'Deceased',       '01812-007007','Tongi, Gazipur',    'NINE', 7000.00, 0,NULL,NOW(),NOW()),
(8, 3,'Puja Mondol',      'STU-KM-2024-001','FEMALE','2011-04-08','Tapan Mondol',  1,'Fisherman',       'Gita Mondol',  1,'Housewife',      '01912-008008','Khulna Sadar',      'SEVEN',6800.00, 0,NULL,NOW(),NOW()),
(9, 3,'Sakib Al Hasan',   'STU-KM-2024-002','MALE',  '2010-08-19','Anwar Hossain', 1,'Bus Driver',      'Fatema Begum', 1,'Housewife',      '01512-009009','Khulna Sadar',      'EIGHT',12000.00,0,NULL,NOW(),NOW()),
(10,3,'Mim Akter',        'STU-KM-2024-003','FEMALE','2012-01-30','Rafiqul Islam', 0,'Deceased',        'Jharna Begum', 1,'Domestic Worker','01612-010010','Jessore Sadar',     'SIX',  4000.00, 1,NULL,NOW(),NOW()),
(11,4,'Md. Liton',        'STU-CB-2024-001','MALE',  '2016-06-11','Noor Mohammad', 1,'Fisherman',       'Amena Begum',  1,'Housewife',      '01712-011011','Coxs Bazar Sadar',  'TWO',  5000.00, 0,NULL,NOW(),NOW()),
(12,4,'Fatema Tuz Zohra', 'STU-CB-2024-002','FEMALE','2015-10-03','Abdul Karim',   1,'Boat Operator',   'Salma Begum',  1,'Housewife',      '01812-012012','Coxs Bazar Sadar',  'THREE',4500.00, 0,NULL,NOW(),NOW()),
(13,5,'Md. Abdullah',     'STU-NM-2024-001','MALE',  '2012-03-22','Sirajul Islam', 1,'Farmer',          'Taslima Begum',1,'Housewife',      '01912-013013','Natore Sadar',      'SIX',  5500.00, 1,NULL,NOW(),NOW()),
(14,5,'Halima Sadia',     'STU-NM-2024-002','FEMALE','2013-07-15','Mozammel Haq',  0,'Deceased',        'Morjina Begum',1,'Maid Servant',   '01512-014014','Natore Sadar',      'FIVE', 3800.00, 1,NULL,NOW(),NOW()),
(15,5,'Jubayer Rahman',   'STU-NM-2024-003','MALE',  '2011-11-28','Lutfur Rahman', 1,'Petty Trader',    'Nasima Begum', 1,'Housewife',      '01612-015015','Natore Sadar',      'SEVEN',7200.00, 0,NULL,NOW(),NOW());

-- =============================================================
-- 11. SCHOOL PROJECTS
-- =============================================================
INSERT INTO school_projects (project_id,school_id,project_title,project_description,project_type_id,required_amount,created_at,updated_at) VALUES
(1,1,'Classroom Renovation - Mirpur GPS',
 'Three classrooms are severely damaged from monsoon. Walls cracked, roofs leaking and furniture broken. Urgent funds needed to renovate before next academic session.',
 2,250000.00,'2024-06-01 10:00:00',NOW()),
(2,1,'Digital Learning Lab Setup',
 'Establish a digital learning lab with 10 computers to introduce ICT education to students from Class 3 onwards.',
 3,350000.00,'2024-07-15 11:00:00',NOW()),
(3,2,'Merit Scholarship for Underprivileged Students',
 'Requesting funds to provide monthly scholarships to 20 meritorious but financially struggling students for academic year 2024-25.',
 1,180000.00,'2024-05-20 09:00:00',NOW()),
(4,3,'Library Expansion and Book Donation Drive',
 'School library is severely under-stocked. Funds needed to purchase 500 new books for Classes 6-10.',
 8,120000.00,'2024-08-01 10:00:00',NOW()),
(5,4,'Mid-Day Meal Programme - Coxs Bazar GPS',
 'Many students come from fishing families and miss school during fishing seasons. A mid-day meal programme would significantly improve attendance.',
 5,200000.00,'2024-07-10 12:00:00',NOW()),
(6,5,'Girls Education Support - Natore Madrasa',
 'To encourage families to keep daughters in school beyond Class 5, we propose a stipend and mentoring programme for female students.',
 7,150000.00,'2024-09-01 09:00:00',NOW());

-- =============================================================
-- 12. NGO PROJECTS
-- =============================================================
INSERT INTO ngo_projects (ngo_project_id,ngo_id,project_name,project_description,project_type_id,budget,start_date,end_date,status,created_at,updated_at) VALUES
(1,1,'BRAC Light of Learning 2024',
 'Comprehensive programme to establish digital learning centres in 50 government primary schools across Dhaka division with tablets, internet and trained facilitators.',
 3,5000000.00,'2024-01-01','2024-12-31','ACTIVE',NOW(),NOW()),
(2,2,'Ashadeep Tea Garden Children Education',
 'Providing non-formal education and bridging courses for children of tea garden workers in Sylhet unable to attend formal schools.',
 1,1200000.00,'2024-03-01','2024-11-30','ACTIVE',NOW(),NOW()),
(3,3,'Protigga Girl Power North Bengal',
 'Dropout prevention campaign targeting adolescent girls in Rajshahi and Rangpur with community mobilisation and cycling to school support.',
 7,2000000.00,'2024-06-01','2025-05-31','ACTIVE',NOW(),NOW()),
(4,1,'Flood Relief Education - Sylhet 2024',
 'Emergency educational support for 2000 flood-affected students in Sylhet providing temporary learning spaces and replacement books.',
 6,800000.00,'2024-08-15','2024-12-31','ACTIVE',NOW(),NOW()),
(5,3,'Teacher Training Rajshahi District',
 'Three-month intensive training for 200 primary school teachers in Rajshahi covering modern teaching methodologies and digital tools.',
 4,600000.00,'2024-04-01','2024-06-30','COMPLETED',NOW(),NOW()),
(6,4,'Coastal Children Health and Nutrition',
 'Mid-day meal and quarterly health checkup for 500 students in 10 coastal schools of Barishal division.',
 5,900000.00,'2024-09-01','2025-08-31','PLANNED',NOW(),NOW());

-- =============================================================
-- 13. PAYMENT TRANSACTIONS (actual schema)
-- =============================================================
INSERT INTO payment_transactions
  (transaction_id,amount,payment_method,status,transaction_reference,transaction_type,currency,customer_name,customer_email,customer_phone,initiated_at,completed_at,donor_id,created_at,updated_at)
VALUES
(1,10000.00,'MOBILE_BANKING','SUCCESS','TXNREF-SSL-2024-001','DONATION','BDT','Karim Rahman',   'karim.rahman@gmail.com',   '01755-111222','2024-07-05 14:29:00','2024-07-05 14:30:00',1,NOW(),NOW()),
(2,25000.00,'MOBILE_BANKING','SUCCESS','TXNREF-SSL-2024-002','DONATION','BDT','Nasrin Begum',   'nasrin.begum@yahoo.com',   '01844-222333','2024-07-10 15:59:00','2024-07-10 16:00:00',2,NOW(),NOW()),
(3, 5000.00,'MOBILE_BANKING','SUCCESS','TXNREF-SSL-2024-003','SPONSORSHIP','BDT','Anonymous',   'fatema.khanam@gmail.com',  '01522-444555','2024-08-01 11:14:00','2024-08-01 11:15:00',4,NOW(),NOW()),
(4,50000.00,'INTERNET_BANKING','SUCCESS','TXNREF-SSL-2024-004','DONATION','BDT','Rahim Uddin',  'rahim.uddin@hotmail.com',  '01933-333444','2024-08-15 09:44:00','2024-08-15 09:45:00',3,NOW(),NOW()),
(5,15000.00,'MOBILE_BANKING','SUCCESS','TXNREF-SSL-2024-005','SPONSORSHIP','BDT','Shahadat Hossain','shahadat.hossain@gmail.com','01677-555666','2024-09-01 12:59:00','2024-09-01 13:00:00',5,NOW(),NOW()),
(6, 8000.00,'MOBILE_BANKING','SUCCESS','TXNREF-SSL-2024-006','DONATION','BDT','Karim Rahman',   'karim.rahman@gmail.com',   '01755-111222','2024-09-05 10:29:00','2024-09-05 10:30:00',1,NOW(),NOW());

-- =============================================================
-- 14. DONATIONS
-- =============================================================
INSERT INTO donations (donation_id,donor_id,project_id,student_id,amount,donation_type,transaction_id,payment_status,purpose,donor_message,is_anonymous,donated_at,payment_completed_at,created_at,updated_at) VALUES
(1,1,1,NULL,10000.00,'ONE_TIME',1,'COMPLETED','SCHOOL_PROJECT',
 'May these renovated classrooms give many children a brighter future. Allah bless you all.',0,'2024-07-05 14:30:00','2024-07-05 14:30:00',NOW(),NOW()),
(2,2,3,NULL,25000.00,'ONE_TIME',2,'COMPLETED','SCHOOL_PROJECT',
 'Education is the most powerful weapon. Happy to support these deserving students.',0,'2024-07-10 16:00:00','2024-07-10 16:00:00',NOW(),NOW()),
(3,4,NULL,3, 5000.00,'MONTHLY', 3,'COMPLETED','STUDENT_SPONSORSHIP',
 NULL,1,'2024-08-01 11:15:00','2024-08-01 11:15:00',NOW(),NOW()),
(4,3,2,NULL,50000.00,'ONE_TIME',4,'COMPLETED','SCHOOL_PROJECT',
 'Digital education is the future. Proud to contribute to the lab setup!',0,'2024-08-15 09:45:00','2024-08-15 09:45:00',NOW(),NOW()),
(5,5,NULL,14,15000.00,'YEARLY', 5,'COMPLETED','STUDENT_SPONSORSHIP',
 'For Halima - may you continue your studies and inspire others around you.',0,'2024-09-01 13:00:00','2024-09-01 13:00:00',NOW(),NOW()),
(6,1,5,NULL, 8000.00,'ONE_TIME',6,'COMPLETED','SCHOOL_PROJECT',
 'No child should go hungry and uneducated. A small help from my side.',0,'2024-09-05 10:30:00','2024-09-05 10:30:00',NOW(),NOW());

-- =============================================================
-- 15. DONOR GAMIFICATION
-- =============================================================
INSERT INTO donor_gamification (gamification_id,donor_id,total_points,impact_score,badges_earned,last_updated) VALUES
(1,1,1800,8.5, '["First Donation","School Builder","3 Donations Milestone"]',NOW()),
(2,2,2500,9.2, '["First Donation","Scholar Patron","Top Donor Month"]',      NOW()),
(3,3,5000,9.8, '["First Donation","Digital Champion","Gold Donor"]',         NOW()),
(4,4, 500,5.0, '["First Donation","Anonymous Hero"]',                        NOW()),
(5,5,1500,7.5, '["First Donation","Student Sponsor"]',                       NOW());

-- =============================================================
-- 16. NGO GAMIFICATION (actual schema: no created_at/updated_at)
-- =============================================================
INSERT INTO ngo_gamification (gamification_id,ngo_id,total_points,impact_score,badges_earned,last_updated) VALUES
(1,1,9500,9.9,'["Gold NGO","Top Impact","500 Students Supported"]',NOW()),
(2,2,5200,8.8,'["Silver NGO","Tea Garden Champion"]',             NOW()),
(3,3,6800,9.1,'["Gold NGO","Girl Power Award"]',                  NOW()),
(4,4, 800,6.5,'["New Member"]',                                   NOW());

-- =============================================================
-- 17. PROJECT UPDATES (actual schema)
-- =============================================================
INSERT INTO project_updates (update_id,project_id,update_title,update_description,progress_percentage,amount_utilized,created_at,updated_at) VALUES
(1,1,'Foundation Work Started',
 'Foundation repair work started on Classroom A and B. Local contractors engaged. Expected completion within 3 weeks.',
 25.00,15000.00,NOW(),NOW()),
(2,1,'50% Renovation Complete',
 'Two classrooms are now fully renovated with new benches and desks delivered. Third classroom roofing underway.',
 50.00,40000.00,NOW(),NOW()),
(3,2,'Computers Ordered and Delivered',
 'All 10 computers and accessories received. Installation in progress. Digital lab expected operational from September 1.',
 40.00,35000.00,NOW(),NOW()),
(4,3,'Scholarship List Finalised',
 'Scholarship committee evaluated 45 applications and selected 20 deserving students. Disbursement starts October 2024.',
 30.00,0.00,NOW(),NOW());

-- =============================================================
-- 18. SCHOOL DOCUMENTS (actual schema)
-- =============================================================
INSERT INTO school_documents (document_id,school_id,document_title,document_type,file_url,is_current,upload_date,uploaded_by,created_at,updated_at) VALUES
(1,1,'Registration Certificate 2010',   'INFRASTRUCTURE','uploads/docs/school_1_reg_cert.pdf',     1,'2024-06-01',1,NOW(),NOW()),
(2,1,'Government Approval Letter',       'OTHER',         'uploads/docs/school_1_govt_approval.pdf',1,'2024-06-01',1,NOW(),NOW()),
(3,2,'Registration Certificate 2005',   'INFRASTRUCTURE','uploads/docs/school_2_reg_cert.pdf',     1,'2024-06-05',2,NOW(),NOW()),
(4,3,'Registration Certificate 2000',   'INFRASTRUCTURE','uploads/docs/school_3_reg_cert.pdf',     1,'2024-06-10',3,NOW(),NOW()),
(5,5,'Madrasa Registration Certificate','INFRASTRUCTURE','uploads/docs/school_5_reg_cert.pdf',     1,'2024-06-15',5,NOW(),NOW());

-- =============================================================
-- 19. DROPOUT PREDICTIONS (actual schema)
-- =============================================================
INSERT INTO dropout_predictions (prediction_id,student_id,attendance_rate,risk_status,last_calculated,created_at,updated_at) VALUES
(1, 3, 0.55,'HIGH',  NOW(),NOW(),NOW()),
(2, 7, 0.60,'HIGH',  NOW(),NOW(),NOW()),
(3,10, 0.58,'HIGH',  NOW(),NOW(),NOW()),
(4,14, 0.52,'HIGH',  NOW(),NOW(),NOW()),
(5,11, 0.70,'MEDIUM',NOW(),NOW(),NOW()),
(6,13, 0.75,'MEDIUM',NOW(),NOW(),NOW());

-- =============================================================
-- 20. SYSTEM METRICS (actual schema)
-- =============================================================
INSERT INTO system_metrics (metric_id,metric_date,calculated_at,total_active_schools,total_verified_schools,total_active_students,total_donors,total_ngos,total_funds_raised,total_funds_utilized,total_active_projects,completed_projects,high_risk_students,total_pending_verifications,average_attendance_rate,utilization_rate) VALUES
(1,CURDATE(),NOW(),5,4,15,5,4,113000.00,90000.00,6,1,4,1,0.68,0.80);

-- =============================================================
-- VERIFY
-- =============================================================
SELECT 'divisions'           AS tbl,COUNT(*) AS cnt FROM divisions
UNION ALL SELECT 'districts',          COUNT(*) FROM districts
UNION ALL SELECT 'upazilas',           COUNT(*) FROM upazilas
UNION ALL SELECT 'project_types',      COUNT(*) FROM project_types
UNION ALL SELECT 'users',              COUNT(*) FROM users
UNION ALL SELECT 'schools',            COUNT(*) FROM schools
UNION ALL SELECT 'donors',             COUNT(*) FROM donors
UNION ALL SELECT 'ngos',               COUNT(*) FROM ngos
UNION ALL SELECT 'students',           COUNT(*) FROM students
UNION ALL SELECT 'school_projects',    COUNT(*) FROM school_projects
UNION ALL SELECT 'ngo_projects',       COUNT(*) FROM ngo_projects
UNION ALL SELECT 'payment_transactions',COUNT(*) FROM payment_transactions
UNION ALL SELECT 'donations',          COUNT(*) FROM donations
UNION ALL SELECT 'donor_gamification', COUNT(*) FROM donor_gamification
UNION ALL SELECT 'dropout_predictions',COUNT(*) FROM dropout_predictions;
