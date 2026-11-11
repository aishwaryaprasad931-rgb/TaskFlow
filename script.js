
let tasks = JSON.parse(localStorage.getItem("taskflowTasks")) || [];
let currentFilter = "all";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priority = document.getElementById("priority");
const deadline = document.getElementById("deadline");
const taskList = document.getElementById("taskList");
const search = document.getElementById("search");

// Display today's date
document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

// Save tasks
function saveTasks() {
    localStorage.setItem("taskflowTasks", JSON.stringify(tasks));
}

// Add a task
taskForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const title = taskInput.value.trim();

    if (!title) return;

    tasks.push({
        id: Date.now(),
        title: title,
        priority: priority.value,
        deadline: deadline.value,
        completed: false
    });

    saveTasks();
    taskForm.reset();
    priority.value = "Medium";
    renderTasks();
});

// Render tasks
function renderTasks() {
    taskList.innerHTML = "";

    const query = search.value.toLowerCase();

    let filtered = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(query);

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "pending" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        return matchesSearch && matchesFilter;
    });

    document.getElementById("emptyMessage").style.display =
        filtered.length ? "none" : "block";

    filtered.forEach(task => {
        const div = document.createElement("div");

        div.className = `task ${task.completed ? "done" : ""}`;

        const info = document.createElement("div");
        info.className = "task-info";

        const heading = document.createElement("h3");
        heading.textContent = task.title;

        const details = document.createElement("p");
        details.textContent =
            `Deadline: ${task.deadline} | Priority: ${task.priority}`;

        const priorityLabel = document.createElement("span");
        priorityLabel.className = `priority ${task.priority}`;
        priorityLabel.textContent = task.priority + " Priority";

        info.append(heading, details, priorityLabel);

        const actions = document.createElement("div");
        actions.className = "actions";

        const completeBtn = document.createElement("button");
        completeBtn.textContent = task.completed ? "↩ Undo" : "✓ Done";
        completeBtn.addEventListener("click", () => toggleTask(task.id));

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏ Edit";
        editBtn.addEventListener("click", () => editTask(task.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑";
        deleteBtn.addEventListener("click", () => deleteTask(task.id));

        actions.append(completeBtn, editBtn, deleteBtn);
        div.append(info, actions);
        taskList.appendChild(div);
    });

    updateStats();
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const progress = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("total").textContent = total;
    document.getElementById("pending").textContent = pending;
    document.getElementById("completed").textContent = completed;
    document.getElementById("progress").textContent = progress + "%";
}

// Complete / Undo
function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed }
            : task
    );

    saveTasks();
    renderTasks();
}

// Delete task
function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    tasks = tasks.filter(task => task.id !== id);

    saveTasks();
    renderTasks();
}

// Edit task
function editTask(id) {
    const task = tasks.find(t => t.id === id);

    const newTitle = prompt("Edit task:", task.title);

    if (newTitle === null) return;

    if (!newTitle.trim()) {
        alert("Task name cannot be empty!");
        return;
    }

    task.title = newTitle.trim();

    saveTasks();
    renderTasks();
}

// Search
search.addEventListener("input", renderTasks);

// Filter tasks
document.querySelectorAll(".nav").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelector(".nav.active")?.classList.remove("active");

        button.classList.add("active");
        currentFilter = button.dataset.filter;

        const titles = {
            all: "All Tasks",
            pending: "Pending Tasks",
            completed: "Completed Tasks"
        };

        document.getElementById("listTitle").textContent =
            titles[currentFilter];

        renderTasks();
    });
});

// Dark / Light mode
document.getElementById("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "taskflowDark",
        document.body.classList.contains("dark")
    );
});

if (localStorage.getItem("taskflowDark") === "true") {
    document.body.classList.add("dark");
}

// Export tasks as CSV
document.getElementById("exportBtn").addEventListener("click", () => {
    if (tasks.length === 0) {
        alert("No tasks available to export!");
        return;
    }

    const escapeCSV = value =>
        '"' + String(value).replace(/"/g, '""') + '"';

    const rows = [
        ["Task", "Priority", "Deadline", "Status"],
        ...tasks.map(t => [
            t.title,
            t.priority,
            t.deadline,
            t.completed ? "Completed" : "Pending"
        ])
    ];

    const csv = rows.map(row =>
        row.map(escapeCSV).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "TaskFlow_Tasks.csv";
    link.click();

    URL.revokeObjectURL(url);
});

// Initial display
renderTasks();
