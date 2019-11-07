-- Drops the employee_tracker_db if it already exists --
DROP DATABASE IF EXISTS employee_tracker_db;

-- Create the database employee_tracker_db and specified it for use.
CREATE DATABASE employee_tracker_db;

USE employee_tracker_db;

-- Create the tables.
CREATE TABLE employees (
  id 			int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  first_name	varchar(30) NOT NULL,
  last_name		varchar(30) NOT NULL,
  role_id		int,
  manager_id 	int,
  department_id int
);

CREATE TABLE role (
	id 				int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title			varchar(30),
    salary			decimal,
    department_id	int
);

CREATE TABLE department (
	id 				int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name			varchar(30)
);
