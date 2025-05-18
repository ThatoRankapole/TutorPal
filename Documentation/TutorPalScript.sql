
   EXECUTE IMMEDIATE 'DROP TABLE student CASCADE CONSTRAINTS';
   EXECUTE IMMEDIATE 'DROP TABLE administrator CASCADE CONSTRAINTS';
   EXECUTE IMMEDIATE 'DROP TABLE predicate CASCADE CONSTRAINTS';
   EXECUTE IMMEDIATE 'DROP TABLE tutor CASCADE CONSTRAINTS';
   EXECUTE IMMEDIATE 'DROP TABLE event_reminder CASCADE CONSTRAINTS';
   EXECUTE IMMEDIATE 'DROP TABLE document CASCADE CONSTRAINTS';
   EXECUTE IMMEDIATE 'DROP TABLE meeting CASCADE CONSTRAINTS';
   EXECUTE IMMEDIATE 'DROP TABLE appointment CASCADE CONSTRAINTS';


CREATE TABLE student (
    student_number int(9) PRIMARY KEY,
    student_email VARCHAR(24),
    student_initials CHAR(4),
    student_surname VARCHAR(30),
    student_password VARCHAR(40)
   
);

CREATE TABLE administrator (
    admin_id int(4) PRIMARY KEY,
    admin_email VARCHAR(40),
    admin_initials CHAR(4),
    admin_surname VARCHAR(30),
    admin_password VARCHAR(40)
);

CREATE TABLE predicate (
    module_name VARCHAR(40),
    student_number int(9),
    class_test_mark int(3),
    semester_test_mark int(3),
    assignment_mark int(3),
    predicate_mark int(3)
);

CREATE TABLE tutor (
    tutor_id int(4) PRIMARY KEY,
    tutor_email VARCHAR(40),
    tutor_initials CHAR(4),
    tutor_surname VARCHAR(30),
    tutor_password VARCHAR(40),
    module_name VARCHAR(40)
);

CREATE TABLE event_reminder (
    reminder_id VARCHAR(30) PRIMARY KEY,
    student_number int(9),
    event_type VARCHAR(30),
    reminder_message VARCHAR(255),
    event_date DATE,
    notification_sent_confirmation CHAR(4)
);

CREATE TABLE document (
    doc_title VARCHAR(50) PRIMARY KEY,
    doc_description VARCHAR(1000),
    doc_verification CHAR(5),
    student_number int(9),
    tutor_id int(4),
    admin_id int(4)
);

CREATE TABLE meeting (
    meeting_name VARCHAR(40) PRIMARY KEY,
    tutor_id int(4),
    student_number int(9),
    meeting_date DATE,
    meeting_time CHAR(5),
    meeting_link VARCHAR(255)
);

CREATE TABLE appointment (
    appointment_id VARCHAR(40) PRIMARY KEY,
    tutor_id int(4),
    student_number int(9),
    appointment_date DATE,
    appointment_time CHAR(5),
    schedule_status CHAR(9)
);

INSERT INTO student VALUES(231240942, '231240942@tut4life.ac.za', 'L', 'Kekana', '2312kekL@SWP');
INSERT INTO student VALUES(231345710, '231345710@tut4life.ac.za', 'YM', 'Khoza', 'YMK123#pro');
INSERT INTO student VALUES(231625712, '231625712@tut4life.ac.za', 'PR', 'Munyai', 'AddCol$2025');
INSERT INTO student VALUES(231830790, '231830790@tut4life.ac.za', 'TC', 'Rankapole', '#Anony500');
INSERT INTO student VALUES(222155857, '222155857@tut4life.ac.za', 'S', 'Malema', '$!ph0M@13m@');
INSERT INTO student VALUES(242947131, '242947131@tut4life.ac.za', 'DMS', 'Miles', 'I@mD!$tanc3');

INSERT INTO administrator VALUES(1001, 'johndoe12@tut.ac.za', 'J', 'Doe', 'Ih@t3MyJ0b');
INSERT INTO administrator VALUES(1002, 'thabisojmojela@tut.ac.za', 'TJ', 'Mojela', 'M0jD@k!ng');
INSERT INTO administrator VALUES(1003, 'naledimosoete@tut.ac.za', 'N', 'Mosoete', 'Qu33nN@le');
INSERT INTO administrator VALUES(1004, 'pauljvdmerwe@tut.ac.za', 'PJ', 'VD Merwe', 'cruiz3RyM00i@');
INSERT INTO administrator VALUES(1005, 'jackwilliams@tut.ac.za', 'J', 'Williams', 'W!llim$3');

INSERT INTO predicate VALUES ('Database Programming', 231240942, 75, 80, 85, 80);
INSERT INTO predicate VALUES ('Database Programming', 231345710, 68, 72, 74, 73);
INSERT INTO predicate VALUES ('Database Programming', 231625712, 85, 90, 93, 87);
INSERT INTO predicate VALUES ('Database Programming', 231830790, 70, 75, 80, 75);
INSERT INTO predicate VALUES ('Database Programming', 222155857, 40, 45, 50, 45);
INSERT INTO predicate VALUES ('Database Programming', 242947131, 85, 88, 90, 87);
INSERT INTO predicate VALUES ('Software project', 231240942, 70, 78, 88, 80);
INSERT INTO predicate VALUES ('Software project', 231345710, 80, 82, 89, 85);
INSERT INTO predicate VALUES ('Software project', 231625712, 78, 80, 90, 85);
INSERT INTO predicate VALUES ('Software project', 231830790, 80, 85, 88, 83);
INSERT INTO predicate VALUES ('Software project', 222155857, 45, 50, 55, 50); 
INSERT INTO predicate VALUES ('Software project', 242947131, 80, 83, 86, 85);
INSERT INTO predicate VALUES ('Internet programming', 231240942, 65, 72, 75, 70);
INSERT INTO predicate VALUES ('Internet programming', 231345710, 60, 68, 72, 65);
INSERT INTO predicate VALUES ('Internet programming', 231625712, 77, 78, 80, 79);
INSERT INTO predicate VALUES ('Internet programming', 231830790, 90, 92, 95, 91);
INSERT INTO predicate VALUES ('Internet programming', 222155857, 72, 80, 82, 77);
INSERT INTO predicate VALUES ('Internet programming', 242947131, 78, 80, 83, 80);
INSERT INTO predicate VALUES ('Mobile Computing', 231240942, 80, 85, 90, 85);
INSERT INTO predicate VALUES ('Mobile Computing', 231345710, 70, 75, 80, 75);
INSERT INTO predicate VALUES ('Mobile Computing', 231625712, 82, 87, 92, 88);
INSERT INTO predicate VALUES ('Mobile Computing', 231830790, 75, 80, 85, 78);
INSERT INTO predicate VALUES ('Mobile Computing', 222155857, 78, 83, 85, 80);
INSERT INTO predicate VALUES ('Mobile Computing', 242947131, 82, 85, 88, 84);

INSERT INTO tutor VALUES (2001, 'ntsakomakondo@tut4life.ac.za', 'N', 'Makondo', 'M@k0nD0', 'Database Programming');
INSERT INTO tutor VALUES (2002, 'harveykjones@tut4life.ac.za', 'HK', 'Jones', 'ILV#life55', 'Software project');
INSERT INTO tutor VALUES (2003, 'josephdwilliams@tut4life.ac.za', 'JD', 'Williams', '$w!tchPh0n3$', 'Internet programming');
INSERT INTO tutor VALUES (2004, 'boitshepothangwana@tut4life.ac.za', 'B', 'Thangwana', 'RS360!$th3w@y', 'Mobile Computing');
INSERT INTO tutor VALUES (2005, 'molobanemashishi@tut4life.ac.za', 'M', 'Mashishi', 'M@sh003Molly', 'Orinciples of Programming A');

INSERT INTO event_reminder VALUES ('rem0001', 231240942, 'class', 'Reminder for Database Programming class in 3 hours', TO_DATE('2025-03-22', 'YYYY-MM-DD'), 'TRUE');
INSERT INTO event_reminder VALUES ('rem0002', 231345710, 'class', 'Reminder for Software project class today at 15:00', TO_DATE('2025-03-22', 'YYYY-MM-DD'), 'TRUE');
INSERT INTO event_reminder VALUES ('rem0003', 231625712, 'semester_test', 'Reminder for upcoming semester test on 2025-03-27 at 11:30', TO_DATE('2025-03-21', 'YYYY-MM-DD'), 'TRUE');
INSERT INTO event_reminder VALUES ('rem0004', 231830790, 'class_test', 'Reminder for class test tomorrow at 08:30', TO_DATE('2025-03-22', 'YYYY-MM-DD'), 'TRUE');
INSERT INTO event_reminder VALUES ('rem0005', 222155857, 'assignment', 'Reminder for assignment that was availed yesterday that is due in 6 days', TO_DATE('2025-03-20', 'YYYY-MM-DD'), 'TRUE');
INSERT INTO event_reminder VALUES ('rem0006', 242947131, 'tutor_meeting', 'Reminder for meeting with tutor today at 19:00', TO_DATE('2025-03-21', 'YYYY-MM-DD'), 'TRUE');

INSERT INTO document VALUES ('DBP class notes', 'Database Programming notes for Friday class', 'FALSE', 231240942, 2001, NULL);
INSERT INTO document VALUES ('SWP Project Guide', 'Software Project guide for assignment 1', 'TRUE', 231345710, 2004, NULL);
INSERT INTO document VALUES ('Revision exercises', 'Solutions for the revision classes done in class today', 'TRUE', 231345710, 2001, 1002);
INSERT INTO document VALUES ('Exam paper', 'the exam paper that sosh students wrote yesterday that might be the same as ours on friday', 'FALSE', 222155857, NULL, 1005);
INSERT INTO document VALUES ('Past paper', 'Internet programming paper that was written in 2018 that you can use to prepare for the semester test', 'TRUE', 231240942, NULL, 1001);

INSERT INTO meeting VALUES ('mtn1', '2001', 231240942, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '19:00', 'https://teams.us/j/123456');
INSERT INTO meeting VALUES ('mtn2', '2002', 231345710, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '14:00', 'https://teams.us/j/234567');
INSERT INTO meeting VALUES ('mtn3', '2003', 231625712, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '15:00', 'https://teams.us/j/345678');
INSERT INTO meeting VALUES ('mtn4', '2004', 231830790, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '16:00', 'https://teams.us/j/456789');
INSERT INTO meeting VALUES ('mtn5', '2005', 240953747, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '11:00', 'https://teams.us/j/567890');

INSERT INTO appointment VALUES ('apnt1', '2001', 231240942, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '10:00', 'Postponed');
INSERT INTO appointment VALUES ('apnt2', '2002', 231345710, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '11:00', 'Postponed');
INSERT INTO appointment VALUES ('apnt3', '2003', 231625712, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '12:00', 'Completed');
INSERT INTO appointment VALUES ('apnt4', '2004', 231830790, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '13:00', 'Completed');
INSERT INTO appointment VALUES ('apnt5', '2005', 242947131, TO_DATE('2025-03-21', 'YYYY-MM-DD'), '09:00', 'Scheduled');

COMMIT;