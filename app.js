document.addEventListener('DOMContentLoaded', () => {
    // Application State
    let state = {
        score: 0,
        lastResetDate: new Date().toDateString(),
        tasks: [
            {
                id: 'task-1',
                title: 'Wake up at 8 AM',
                basePoints: 5,
                targetTime: '08:00', // 24-hour format
                penaltyPerHour: 1, // Points lost per hour late
                completed: false,
                pointsEarned: 0,
                completedAt: null
            },
            {
                id: 'task-2',
                title: 'Brush teeth',
                basePoints: 5,
                targetTime: null, // No specific target time
                penaltyPerHour: 0,
                completed: false,
                pointsEarned: 0,
                completedAt: null
            },
            {
                id: 'task-3',
                title: 'Breakfast',
                basePoints: 5,
                targetTime: null,
                penaltyPerHour: 0,
                completed: false,
                pointsEarned: 0,
                completedAt: null
            }
        ]
    };

    // DOM Elements
    const totalScoreEl = document.getElementById('total-score');
    const currentDateEl = document.getElementById('current-date');
    const taskListEl = document.getElementById('task-list');
    const simulateTimeInput = document.getElementById('simulate-time');
    const resetBtn = document.getElementById('reset-btn');
    const liveTimeEl = document.getElementById('live-time');

    // Initialize App
    function init() {
        loadState();
        checkDailyReset();
        renderDate();
        renderTasks();
        updateScoreDisplay();
        startLiveClock();
    }

    // Start clock to display current time at the bottom
    function startLiveClock() {
        const updateClock = () => {
            const now = new Date();
            let h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, '0');
            const s = now.getSeconds().toString().padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12; // Convert to 12-hour format
            liveTimeEl.textContent = `${h}:${m}:${s} ${ampm}`;
        };
        updateClock(); // Initial call
        setInterval(updateClock, 1000);
    }

    // Load state from local storage
    function loadState() {
        const savedState = localStorage.getItem('powerflow_state');
        if (savedState) {
            state = JSON.parse(savedState);
        }
    }

    // Save state to local storage
    function saveState() {
        localStorage.setItem('powerflow_state', JSON.stringify(state));
    }

    // Reset daily tasks if it's a new day
    function checkDailyReset() {
        const today = new Date().toDateString();
        if (state.lastResetDate !== today) {
            state.score = 0;
            state.lastResetDate = today;
            state.tasks.forEach(t => {
                t.completed = false;
                t.pointsEarned = 0;
                t.completedAt = null;
            });
            saveState();
        }
    }

    // Set current date display
    function renderDate() {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Calculate points based on time
    function calculatePoints(task, completedTimeStr) {
        if (!task.targetTime || task.penaltyPerHour === 0) {
            return task.basePoints;
        }

        // Parse target time
        const [targetHour, targetMin] = task.targetTime.split(':').map(Number);
        
        // Parse completed time
        const [compHour, compMin] = completedTimeStr.split(':').map(Number);

        // Convert to absolute minutes for easier comparison
        const targetAbsMinutes = targetHour * 60 + targetMin;
        const compAbsMinutes = compHour * 60 + compMin;

        if (compAbsMinutes <= targetAbsMinutes) {
            return task.basePoints; // On time or early
        }

        // Calculate hours late (rounded down for full hours, or can be fractional, but let's use floor for "every hour he sleeps in")
        const minutesLate = compAbsMinutes - targetAbsMinutes;
        const hoursLate = Math.floor(minutesLate / 60);

        const pointsLost = hoursLate * task.penaltyPerHour;
        const finalPoints = Math.max(0, task.basePoints - pointsLost); // Don't go below 0

        return finalPoints;
    }

    // Handle task completion toggle
    function toggleTask(taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (!task.completed) {
            // Get time from simulator for testing, or current real time
            const timeVal = simulateTimeInput.value;
            let completedTimeStr = timeVal;
            
            if (!completedTimeStr) {
                 const now = new Date();
                 completedTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            }

            const earned = calculatePoints(task, completedTimeStr);
            task.completed = true;
            task.pointsEarned = earned;
            task.completedAt = completedTimeStr;
            state.score += earned;
        } else {
            // Uncheck task
            task.completed = false;
            state.score -= task.pointsEarned;
            task.pointsEarned = 0;
            task.completedAt = null;
        }

        saveState();
        renderTasks();
        updateScoreDisplay();
    }

    // Render the task list to the DOM
    function renderTasks() {
        taskListEl.innerHTML = ''; // Clear current

        state.tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${task.completed ? 'completed' : ''}`;
            
            let timeInfo = '';
            if (task.targetTime) {
                timeInfo = `<span class="task-target">Target: ${formatTime(task.targetTime)}</span>`;
            }
            if (task.completed) {
                timeInfo += ` <span>(Completed: ${formatTime(task.completedAt)})</span>`;
            }

            let penaltyInfo = '';
            if (task.completed && task.targetTime && task.pointsEarned < task.basePoints) {
                penaltyInfo = `<span class="task-penalty">-${task.basePoints - task.pointsEarned} pts (Late)</span>`;
            }

            card.innerHTML = `
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="task-points">${task.completed ? task.pointsEarned : task.basePoints} pts</span>
                        ${timeInfo}
                        ${penaltyInfo}
                    </div>
                </div>
                <button class="complete-btn" aria-label="${task.completed ? 'Uncomplete' : 'Complete'} task"></button>
            `;

            card.querySelector('.complete-btn').addEventListener('click', () => toggleTask(task.id));

            taskListEl.appendChild(card);
        });
    }

    // Update the large score display
    function updateScoreDisplay() {
        // Animate score increment (simple version)
        const currentDisplayed = parseInt(totalScoreEl.textContent);
        const target = state.score;
        
        if (currentDisplayed !== target) {
            totalScoreEl.textContent = target;
            // Add a little pop animation class
            totalScoreEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                totalScoreEl.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // Helper: format 24h time to 12h AM/PM
    function formatTime(timeStr) {
        if (!timeStr) return '';
        const [hourStr, minStr] = timeStr.split(':');
        let h = parseInt(hourStr);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minStr} ${ampm}`;
    }

    // Reset button for testing
    resetBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to reset today's progress?")) {
            state.score = 0;
            state.tasks.forEach(t => {
                t.completed = false;
                t.pointsEarned = 0;
                t.completedAt = null;
            });
            saveState();
            renderTasks();
            updateScoreDisplay();
        }
    });

    // Run initialization
    init();
});
