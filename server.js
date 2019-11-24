const inquirer = require("inquirer");
const express = require("express");
const mysql = require("mysql");
const querystring = require("querystring");
const bodyParser = require("body-parser");
const figlet = require("figlet");

const app = express();
var db;

class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

if (process.env.JAWSDB_URL) {
  db = new Database(process.env.JAWSDB_URL);
} else {
  db = new Database({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "IamTheBoxGhost1971",
    database: "employee_tracker_db"
  });
}

var team = [];
let part2 = "";
let part3 = "";
end_condtn = false;

async function employeeTracker() {
  let part1 = await inquirer.prompt([
    {
      type: "list",
      message: "Employee Tracker Menu:",
      name: "menu_option",
      choices: [
        "Maintain Department Information",
        "Maintain Employee Information"
        // ,
        // "Terminator - end data entry"
      ]
    }
  ]);
  if (part1.menu_option == "Maintain Department Information") {
    let mngrObject = await departmentInfo();
  } else if (part1.menu_option == "Maintain Employee Information") {
    let engnrObject = await employeeMaintenance();
    // } else if (part1.menu_option == "Terminator - end data entry") {
    //   end_condtn = true;
  }
}

// Department section
async function departmentInfo() {
  let part2 = await inquirer.prompt([
    {
      type: "list",
      message: "Choose action : ",
      name: "sub_Dept",
      choices: [
        "List Departments",
        "Create Department",
        "Update Department",
        "Delete Department",
        "List Department Roles",
        "Create Department Roles",
        "Update Department Role",
        "Delete Department Role",
        "View Department Budget"
      ]
    }
  ]);
  if (part2.sub_Dept == "Create Department") {
    let dept_hndlr = await createDepartment();
  } else if (part2.sub_Dept == "List Departments") {
    let dept_hndlr = await listDepartments();
  } else if (part2.sub_Dept == "Update Department") {
    let dept_hndlr = await updateDepartment();
  } else if (part2.sub_Dept == "Delete Department") {
    let dept_hndlr = await deleteDepartment();
  } else if (part2.sub_Dept == "List Department Roles") {
    let dept_hndlr = await listRoleInfo("%");
  } else if (part2.sub_Dept == "Create Department Roles") {
    let dept_hndlr = await getRoleInfo();
  } else if (part2.sub_Dept == "Update Department Role") {
    let dept_hndlr = await updateRoleInfo();
  } else if (part2.sub_Dept == "View Department Budget") {
    let dept_hndlr = await showDepartmentBudget();
  }
}

async function listDepartments() {
  result = await db.query("select id, name from department");
  console.table(result);
}

async function createDepartment() {
  let part2 = await inquirer.prompt([
    {
      type: "input",
      name: "dept_name",
      message: "Enter Department Name :"
    }
  ]);
  let result = await db.query("insert into department (name) values(?)", [
    part2.dept_name
  ]);
  await listDepartments();
}

async function showDepartmentBudget() {
  result = await db.query(
    "select department.name, sum(role.salary) from department inner join role on department.id = role.department_id group by department.name"
  );
  console.table(result);
}
async function updateDepartment() {
  let part2 = await inquirer.prompt([
    {
      type: "input",
      name: "dept_name",
      message: "Enter Department Name to be changed :"
    },
    {
      type: "input",
      name: "new_name",
      message: "Enter Department's new name :"
    }
  ]);
  let result = await db.query("update department set name = ? where name = ?", [
    part2.new_name,
    part2.dept_name
  ]);
  await listDepartments();
}

async function deleteDepartment() {
  let part2 = await inquirer.prompt([
    {
      type: "input",
      name: "department_id",
      message: "Enter id of department to be deleted :"
    }
  ]);
  let result = await db.query("delete from department where id = ?", [
    part2.department_id
  ]);
  await listDepartments();
}

async function listRoleInfo(dept) {
  result = await db.query(
    "select * from role inner join department on department_id = department.id where department_id like ?",
    [dept]
  );
  console.table(result);
}

async function listManagers(dept) {
  result = await db.query(
    `select emp.id, emp.first_name, emp.last_name, role.title from employees emp inner join role on emp.role_id = role.id where role.title = "Manager" and emp.department_id like ?`,
    [dept]
  );
  console.table(result);
}

async function getRoleInfo() {
  await listDepartments();

  let part2 = await inquirer.prompt([
    {
      type: "input",
      name: "dept_id",
      message: "Enter ID of Department role is assigned to :"
    },
    {
      type: "input",
      name: "role_name",
      message: "Enter name of department role :"
    },
    {
      type: "input",
      name: "salary",
      message: "Enter salary for this role :"
    }
  ]);

  if (part2.role_name == "Manager") {
    let result = await db.query(
      "select count(*) as count from role where  id = ? and title = ?",
      [part2.dept_id, part2.role_name]
    );

    if (result[0].count == 0) {
      let result = await db.query(
        "insert into role (title, salary, department_id) values(?, ?, ?)",
        [part2.role_name, part2.salary, part2.dept_id]
      );
    } else {
      await console.log("Manager already exists for this department");
    }
  } else {
    let result = await db.query(
      "insert into role (title, salary, department_id) values(?, ?, ?)",
      [part2.role_name, part2.salary, part2.dept_id]
    );
  }
  await listRoleInfo(part2.dept_id);
}

async function updateRoleInfo(tbl_col, col_val) {
  result = await db.query(
    `select emp.id, emp.first_name, emp.last_name, emp.role_id, emp.department_id, department.name, emp.manager_id, , title, CONCAT(employees.first_name," ",employees.last_name) as manager_name from employees emp inner join role on emp.role_id = role.id inner join department on emp.department_id = department.id left join employees on emp.manager_id = employees.id where emp.${tbl_col} like ?`,
    [col_val]
  );
  console.table(result);
}

// Employee section
async function employeeMaintenance() {
  let part2 = await inquirer.prompt([
    {
      type: "list",
      message: "Choose action : ",
      name: "sub_Emp",
      choices: [
        "List Employees",
        "List Employees by Manager",
        "Create Employee",
        "Update Employee",
        "Delete Employee"
      ]
    }
  ]);
  if (part2.sub_Emp == "List Employees") {
    let emp_hndlr = await listEmployees("id", "%");
  } else if (part2.sub_Emp == "List Employees by Manager") {
    let emp_hndlr = await listEmployeesByManager();
  } else if (part2.sub_Emp == "Create Employee") {
    let emp_hndlr = await createEmployee();
  } else if (part2.sub_Emp == "Update Employee") {
    let emp_hndlr = await updateEmployee();
  } else if (part2.sub_Emp == "Delete Department") {
    let emp_hndlr = await deleteDepartment();
  } else if (part2.sub_Emp == "List Department Roles") {
    let emp_hndlr = await listRoleInfo("%");
  } else if (part2.sub_Emp == "Create Department Roles") {
    let emp_hndlr = await getRoleInfo();
  }
}

async function listEmployees(tbl_col, col_val) {
  result = await db.query(
    `select emp.id, emp.first_name, emp.last_name, emp.role_id, emp.department_id, department.name, emp.manager_id, title, CONCAT(employees.first_name," ",employees.last_name) as manager_name from employees emp inner join role on emp.role_id = role.id inner join department on emp.department_id = department.id left join employees on emp.manager_id = employees.id where emp.${tbl_col} like ?`,
    [col_val]
  );
  console.table(result);
}

async function listEmployeesByManager() {
  await listManagers("%");
  let part2 = await inquirer.prompt([
    {
      type: "input",
      name: "manager_id",
      message: "Enter manager id to filter employee list :"
    }
  ]);
  await listEmployees("manager_id", part2.manager_id);
}

async function createEmployee() {
  await listDepartments();
  let part2 = await inquirer.prompt([
    {
      type: "input",
      name: "department_id",
      message: "Enter the department to which employee is being assigned :"
    }
  ]);
  await listRoleInfo(part2.department_id);

  let part3 = await inquirer.prompt([
    {
      type: "input",
      name: "first_name",
      message: "Enter employee's first name :"
    },
    {
      type: "input",
      name: "last_name",
      message: "Enter employee's last name :"
    },
    {
      type: "input",
      name: "role_id",
      message: "Enter employee's role id :"
    }
  ]);

  await listManagers(part2.department_id);

  let part4 = await inquirer.prompt([
    {
      type: "input",
      name: "manager_id",
      message: "Enter employee's manager :"
    }
  ]);
  let result = await db.query(
    "insert into employees (first_name, last_name, role_id, manager_id, department_id) values (?, ?, ?, ?, ?)",
    [
      part3.first_name,
      part3.last_name,
      part3.role_id,
      part4.manager_id,
      part2.department_id
    ]
  );
  await listEmployees("id", result.insertId);
}

async function updateEmployee() {
  await listEmployees("id", "%");
  await listDepartments();
  let part2 = await inquirer.prompt([
    {
      type: "input",
      name: "demployee_id",
      message: `Enter ID of employee to be updated :`
    },
    {
      type: "input",
      name: "department_id",
      message: `Enter ID of employee's new department (leave blank if unchanged) :`
    }
  ]);
  await listRoleInfo(part2.department_id);

  let part3 = await inquirer.prompt([
    {
      type: "input",
      name: "first_name",
      message: "Update employee's first name (leave blank if unchanged) :"
    },
    {
      type: "input",
      name: "last_name",
      message: "Enter employee's last name (leave blank if unchanged) :"
    },
    {
      type: "input",
      name: "role_id",
      message: "Enter ID of employee's new role (leave blank if unchanged) :"
    }
  ]);

  await listManagers(part2.department_id);

  let part4 = await inquirer.prompt([
    {
      type: "input",
      name: "manager_id",
      message: "Enter ID employee's new manager (leave blank if unchanged) :"
    }
  ]);
  let updColumns = "set ";
  let updValues = [];
  let updPlchldrs = "";
  if (part2.department_id) {
    updColumns = updColumns.concat(
      `department_id=ifnull(${part2.department_id}, department_id)`
    );
  }
  if (part3.first_name) {
    updColumns = updColumns.concat(
      `,first_name=ifnull("${part3.first_name}", first_name)`
    );
  }
  if (part3.last_name) {
    updColumns = updColumns.concat(
      `,last_name=ifnull("${part3.last_name}", last_name)`
    );
  }
  if (part4.manager_id) {
    updColumns = updColumns.concat(
      `,manager_id=ifnull(${part4.manager_id}, manager_id)`
    );
  }
  console.log(updColumns);

  let result = await db.query(`update employees ${updColumns}`);
  await listEmployees("id", "%");
}

async function build_team() {
  let title_hndlr = figlet("Employee Tracker", async function(err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(data);
    while (!end_condtn) {
      let part1 = "";
      let part2 = "";
      let part3 = "";
      let part4 = "";
      await employeeTracker();
    }
    db.close();
  });
}

build_team();
