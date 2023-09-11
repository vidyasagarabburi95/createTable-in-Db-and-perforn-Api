const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();

app.use(express.json());

let db = null;

const startDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server started at http://localhost:3000/");
    });
  } catch (e) {
    console.error(`DB error: ${e.message}`);
    process.exit(1);
  }
};

startDbAndServer();
/*for creating table in db
-- Create the 'todo' table
CREATE TABLE IF NOT EXISTS todo (
  id INTEGER PRIMARY KEY,
  todo TEXT,
  priority TEXT,
  status TEXT
);
INSERT INTO todo (id, todo, priority, status)
VALUES
  (1, 'Learn HTML', 'HIGH', 'todo'),
  (2, 'Learn JS', 'MEDIUM', 'DONE'),
  (3, 'Learn CSS', 'LOW', 'DONE'),
  (4, 'Play CHESS', 'LOW', 'DONE');

 */

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityHigh = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getQuery = "";
  let data = null;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%'
            AND status='${status}'
            AND priority='${priority}'`;
      break;
    case hasPriorityHigh(request.query):
      getQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND priority='${priority}'`;
      break;
    case hasStatus(request.query):
      getQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND status='${status}'`;
      break;
    default:
      getQuery = `
      SELECT * FROM todo 
      WHERE todo LIKE '%${search_q}%'`;
      break;
  }
  data = await db.all(getQuery); // Changed from db.get to db.all to get multiple rows
  response.send(data);
  console.log(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `
    SELECT * FROM todo 
    WHERE id='${todoId}'`;
  const data = await db.get(getQuery);
  response.send(data);
  console.log(data);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `
    INSERT INTO todo
    (id, todo, priority, status)
    VALUES
    ('${id}', '${todo}', '${priority}', '${status}')
    `;
  let q = await db.run(postQuery);
  response.send("Todo Successfully Added");
  console.log(q);
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const prevQuery = `
    SELECT * FROM todo
    WHERE id='${todoId}'`;
  const prevTodo = await db.get(prevQuery);
  const {
    todo: prevTodoTodo,
    priority: prevTodoPriority,
    status: prevTodoStatus,
  } = request.body;
  const updateQuery = `
    UPDATE todo
    SET
    todo='${prevTodoTodo || prevTodo.todo}',
    priority='${prevTodoPriority || prevTodo.priority}',
    status='${prevTodoStatus || prevTodo.status}'
    WHERE id='${todoId}'`;
  let v = await db.run(updateQuery);
  response.send(`${updateColumn}` + " " + "Updated");
  console.log(v);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo
    WHERE id='${todoId}'`;
  let c = await db.run(deleteQuery); // Added 'await' here
  response.send("Todo Deleted");
  console.log(c);
});

module.exports = app;
