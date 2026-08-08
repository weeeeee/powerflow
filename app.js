document.addEventListener('DOMContentLoaded', () => {
    // Default initial tasks if none exist in localStorage
    const defaultTasks = [
        {
            id: 'task-1',
            title: 'Wake up at 8 AM',
            basePoints: 5,
            targetTime: '08:00',
            penaltyPerHour: 1,
            completed: false,
            pointsEarned: 0,
            completedAt: null
        },
        {
            id: 'task-2',
            title: 'Brush teeth',
            basePoints: 5,
            targetTime: null,
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
    ];

    // Default initial side quests
    const defaultSideQuests = [
        {
            id: 'sq-1',
            title: 'Organize Bedroom Toys',
            points: 10,
            category: 'Chores',
            completed: false,
            completedAt: null
        },
        {
            id: 'sq-2',
            title: 'Read Extra 15 Mins',
            points: 15,
            category: 'Learning',
            completed: false,
            completedAt: null
        }
    ];

    // Default initial store items
    const defaultStoreItems = [
        { id: 'store-1', title: '$5.00 Cash', points: 50, icon: '💵' },
        { id: 'store-2', title: 'Extra 30 mins Screen Time', points: 30, icon: '🎮' },
        { id: 'store-3', title: 'DoorDash Delivery', points: 200, icon: '🍔' }
    ];

    // Application State
    let state = {
        score: 0,
        weeklyScore: 0,
        allTimeScore: 0,
        parentPassword: '1234',
        isParentUnlocked: false,
        lastResetDate: new Date().toDateString(),
        tasks: defaultTasks,
        sideQuests: defaultSideQuests,
        storeItems: defaultStoreItems,
        adjustments: [] // Log of manual points adjustments: { id, type, amount, reason, timestamp }
    };

    // DOM Elements - Navigation & Views
    const navScheduleBtn = document.getElementById('nav-schedule-btn');
    const navStoreBtn = document.getElementById('nav-store-btn');
    const navParentBtn = document.getElementById('nav-parent-btn');
    const scheduleView = document.getElementById('schedule-view');
    const storeView = document.getElementById('store-view');
    const parentView = document.getElementById('parent-view');

    // DOM Elements - Kid Schedule View
    const totalScoreEl = document.getElementById('total-score');
    const currentDateEl = document.getElementById('current-date');
    const taskListEl = document.getElementById('task-list');
    const kidTaskCountEl = document.getElementById('kid-task-count');
    const simulateTimeInput = document.getElementById('simulate-time');
    const resetBtn = document.getElementById('reset-btn');
    const liveTimeEl = document.getElementById('live-time');

    // DOM Elements - Kid Store View
    const storeTotalScoreEl = document.getElementById('store-total-score');
    const storeListEl = document.getElementById('store-list');
    const kidStoreCountEl = document.getElementById('kid-store-count');

    // DOM Elements - Parent Portal View
    const lockPortalBtn = document.getElementById('lock-portal-btn');
    const changePassBtn = document.getElementById('change-pass-btn');
    const parentTotalScoreEl = document.getElementById('parent-total-score');
    const parentEventCountEl = document.getElementById('parent-event-count');
    const parentAdjCountEl = document.getElementById('parent-adj-count');
    const openAddEventBtn = document.getElementById('open-add-event-btn');
    const openAddStoreBtn = document.getElementById('open-add-store-btn');
    const openAdjustPointsBtn = document.getElementById('open-adjust-points-btn');
    const parentEventListEl = document.getElementById('parent-event-list');
    const parentStoreListEl = document.getElementById('parent-store-list');
    const pointsHistoryListEl = document.getElementById('points-history-list');

    // DOM Elements - Modals & Forms
    const passwordModal = document.getElementById('password-modal');
    const passwordForm = document.getElementById('password-form');
    const parentPasswordInput = document.getElementById('parent-password-input');
    const togglePassVisibilityBtn = document.getElementById('toggle-pass-visibility');
    const passwordErrorMsg = document.getElementById('password-error');
    const closePasswordModalBtn = document.getElementById('close-password-modal');
    const cancelPasswordBtn = document.getElementById('cancel-password-btn');

    const eventModal = document.getElementById('event-modal');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventForm = document.getElementById('event-form');
    const eventEditIdInput = document.getElementById('event-edit-id');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventPointsInput = document.getElementById('event-points-input');
    const eventTimeInput = document.getElementById('event-time-input');
    const eventPenaltyInput = document.getElementById('event-penalty-input');
    const closeEventModalBtn = document.getElementById('close-event-modal');
    const cancelEventBtn = document.getElementById('cancel-event-btn');

    const storeModal = document.getElementById('store-modal');
    const storeForm = document.getElementById('store-form');
    const closeStoreModalBtn = document.getElementById('close-store-modal');
    const cancelStoreBtn = document.getElementById('cancel-store-btn');

    const pointsModal = document.getElementById('points-modal');
    const pointsForm = document.getElementById('points-form');
    const pointsAmountInput = document.getElementById('points-amount-input');
    const pointsReasonInput = document.getElementById('points-reason-input');
    const closePointsModalBtn = document.getElementById('close-points-modal');
    const cancelPointsBtn = document.getElementById('cancel-points-btn');

    const changePassModal = document.getElementById('change-pass-modal');
    const changePassForm = document.getElementById('change-pass-form');
    const currentPassInput = document.getElementById('current-pass-input');
    const newPassInput = document.getElementById('new-pass-input');
    const confirmPassInput = document.getElementById('confirm-pass-input');
    const passChangeError = document.getElementById('pass-change-error');
    const closeChangePassModalBtn = document.getElementById('close-change-pass-modal');
    const cancelChangePassBtn = document.getElementById('cancel-change-pass-btn');

    // Initialize Application
    function init() {
        loadState();
        checkDailyReset();
        recalculateTotalScore();
        renderDate();
        renderScheduleTasks();
        renderSideQuests();
        renderStore();
        renderParentPortal();
        updateScoreDisplays();
        startLiveClock();
        setupEventListeners();
    }

    // Load state from local storage
    function loadState() {
        const savedState = localStorage.getItem('powerflow_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                state = { ...state, ...parsed };
                // Ensure arrays exist
                if (!Array.isArray(state.tasks)) state.tasks = defaultTasks;
                if (!Array.isArray(state.sideQuests)) state.sideQuests = defaultSideQuests;
                if (!Array.isArray(state.storeItems)) state.storeItems = defaultStoreItems;
                if (!Array.isArray(state.adjustments)) state.adjustments = [];
                if (!state.parentPassword) state.parentPassword = '1234';
                if (typeof state.weeklyScore !== 'number') state.weeklyScore = 0;
                if (typeof state.allTimeScore !== 'number') state.allTimeScore = 0;
            } catch (e) {
                console.error("Failed to parse saved state:", e);
            }
        }
        // Always lock portal on fresh session load
        state.isParentUnlocked = false;
    }

    // Save state to local storage
    function saveState() {
        const stateToSave = {
            score: state.score,
            weeklyScore: state.weeklyScore,
            allTimeScore: state.allTimeScore,
            parentPassword: state.parentPassword,
            lastResetDate: state.lastResetDate,
            tasks: state.tasks,
            sideQuests: state.sideQuests,
            storeItems: state.storeItems,
            adjustments: state.adjustments
        };
        localStorage.setItem('powerflow_state', JSON.stringify(stateToSave));
    }

    // Recalculate score from task earnings + side quests + manual adjustments
    function recalculateTotalScore() {
        let taskScore = 0;
        state.tasks.forEach(t => {
            if (t.completed) {
                taskScore += (t.pointsEarned !== undefined ? t.pointsEarned : t.basePoints);
            }
        });

        let questScore = 0;
        if (Array.isArray(state.sideQuests)) {
            state.sideQuests.forEach(q => {
                if (q.completed) {
                    questScore += (q.points || 0);
                }
            });
        }

        let adjScore = 0;
        state.adjustments.forEach(adj => {
            if (adj.type === 'add') {
                adjScore += adj.amount;
            } else if (adj.type === 'subtract') {
                adjScore -= adj.amount;
            }
        });

        state.score = Math.max(0, taskScore + questScore + adjScore);
    }

    // Helper to check if two dates are in different weeks (using Monday as start of week)
    function isDifferentWeek(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        // Normalize to midnight
        d1.setHours(0,0,0,0);
        d2.setHours(0,0,0,0);
        
        const day1 = d1.getDay() === 0 ? 6 : d1.getDay() - 1;
        const monday1 = new Date(d1);
        monday1.setDate(d1.getDate() - day1);
        
        const day2 = d2.getDay() === 0 ? 6 : d2.getDay() - 1;
        const monday2 = new Date(d2);
        monday2.setDate(d2.getDate() - day2);
        
        return monday1.getTime() !== monday2.getTime();
    }

    // Reset daily tasks & side quests if a new day has started
    function checkDailyReset() {
        const todayStr = new Date().toDateString();
        if (state.lastResetDate !== todayStr) {
            const previousScore = state.score || 0;
            
            // Add previous day's score to all-time
            state.allTimeScore = (state.allTimeScore || 0) + previousScore;
            
            // Check for new week
            if (isDifferentWeek(state.lastResetDate, todayStr)) {
                state.weeklyScore = 0; // Fresh week, it doesn't include yesterday
            } else {
                state.weeklyScore = (state.weeklyScore || 0) + previousScore;
            }

            state.lastResetDate = todayStr;
            state.tasks.forEach(t => {
                t.completed = false;
                t.pointsEarned = 0;
                t.completedAt = null;
            });
            if (Array.isArray(state.sideQuests)) {
                state.sideQuests.forEach(q => {
                    q.completed = false;
                    q.completedAt = null;
                });
            }
            state.adjustments = []; // Clear daily adjustments
            
            recalculateTotalScore();
            saveState();

            if (typeof updateScoreDisplays === 'function') {
                updateScoreDisplays();
            }
        }
    }

    // Clock display
    function startLiveClock() {
        const updateClock = () => {
            const now = new Date();
            let h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, '0');
            const s = now.getSeconds().toString().padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            liveTimeEl.textContent = `${h}:${m}:${s} ${ampm}`;

            // Check for midnight crossing while app is open
            if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
                checkDailyReset();
                renderScheduleTasks();
                renderSideQuests();
                renderParentPortal();
            }
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    // Format current date
    function renderDate() {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Helper to format 24h time string into 12h AM/PM
    function formatTime(timeStr) {
        if (!timeStr) return '';
        const [hourStr, minStr] = timeStr.split(':');
        let h = parseInt(hourStr, 10);
        if (isNaN(h)) return '';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minStr} ${ampm}`;
    }

    // Calculate points for task completion based on time
    function calculatePoints(task, completedTimeStr) {
        if (!task.targetTime || !task.penaltyPerHour || task.penaltyPerHour <= 0) {
            return task.basePoints;
        }

        const [targetHour, targetMin] = task.targetTime.split(':').map(Number);
        const [compHour, compMin] = completedTimeStr.split(':').map(Number);

        const targetAbsMinutes = targetHour * 60 + targetMin;
        const compAbsMinutes = compHour * 60 + compMin;

        if (compAbsMinutes <= targetAbsMinutes) {
            return task.basePoints;
        }

        const minutesLate = compAbsMinutes - targetAbsMinutes;
        const hoursLate = Math.floor(minutesLate / 60);

        const pointsLost = hoursLate * task.penaltyPerHour;
        return Math.max(0, task.basePoints - pointsLost);
    }

    // Toggle task completion in Kid View
    function toggleTask(taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (!task.completed) {
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
        } else {
            task.completed = false;
            task.pointsEarned = 0;
            task.completedAt = null;
        }

        recalculateTotalScore();
        saveState();
        renderScheduleTasks();
        renderParentPortal();
        updateScoreDisplays();
    }

    // Render Kid View Schedule
    function renderScheduleTasks() {
        taskListEl.innerHTML = '';
        kidTaskCountEl.textContent = `${state.tasks.length} Event${state.tasks.length !== 1 ? 's' : ''}`;

        if (state.tasks.length === 0) {
            taskListEl.innerHTML = `<div class="empty-state">No scheduled events yet. Ask a parent to add events!</div>`;
            return;
        }

        state.tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${task.completed ? 'completed' : ''}`;

            let timeInfo = '';
            if (task.targetTime) {
                timeInfo = `<span class="task-target">Target: ${formatTime(task.targetTime)}</span>`;
            }
            if (task.completed && task.completedAt) {
                timeInfo += ` <span>(Done: ${formatTime(task.completedAt)})</span>`;
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

    // Helper icon getter for categories
    function getCategoryIcon(cat) {
        switch (cat) {
            case 'Chores': return '🧹';
            case 'Learning': return '📚';
            case 'Kindness': return '💖';
            case 'Health': return '🍎';
            default: return '🎯';
        }
    }

    // Toggle Side Quest Completion
    function toggleSideQuest(questId) {
        const quest = (state.sideQuests || []).find(q => q.id === questId);
        if (!quest) return;

        if (!quest.completed) {
            const timeVal = simulateTimeInput ? simulateTimeInput.value : '';
            let completedTimeStr = timeVal;
            if (!completedTimeStr) {
                const now = new Date();
                completedTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            }
            quest.completed = true;
            quest.completedAt = completedTimeStr;
        } else {
            quest.completed = false;
            quest.completedAt = null;
        }

        recalculateTotalScore();
        saveState();
        renderSideQuests();
        renderParentPortal();
        updateScoreDisplays();
    }

    // Render Kid View Side Quests
    function renderSideQuests() {
        const sideQuestListEl = document.getElementById('sidequest-list');
        const kidQuestBadgeEl = document.getElementById('kid-quest-badge');

        if (!sideQuestListEl || !kidQuestBadgeEl) return;

        sideQuestListEl.innerHTML = '';
        const quests = state.sideQuests || [];
        kidQuestBadgeEl.textContent = `${quests.length} Bonus Quest${quests.length !== 1 ? 's' : ''}`;

        if (quests.length === 0) {
            sideQuestListEl.innerHTML = `<div class="empty-state">No daily side quests active today. Ask a parent to assign bonus quests!</div>`;
            return;
        }

        quests.forEach(quest => {
            const card = document.createElement('div');
            card.className = `task-card quest-card ${quest.completed ? 'completed' : ''}`;

            const icon = getCategoryIcon(quest.category);

            card.innerHTML = `
                <div class="task-info">
                    <div class="task-title">${icon} ${quest.title}</div>
                    <div class="task-meta">
                        <span class="quest-points-badge">+${quest.points} Bonus Pts</span>
                        <span class="event-tag">${quest.category || 'Custom'}</span>
                        ${quest.completed && quest.completedAt ? `<span>(Done: ${formatTime(quest.completedAt)})</span>` : ''}
                    </div>
                </div>
                <button class="complete-btn quest-complete-btn" aria-label="${quest.completed ? 'Uncomplete' : 'Complete'} side quest"></button>
            `;

            card.querySelector('.complete-btn').addEventListener('click', () => toggleSideQuest(quest.id));
            sideQuestListEl.appendChild(card);
        });
    }

    // Render Parent Portal Views (Events list + Side Quests list + Audit log + Stats)
    function renderParentPortal() {
        parentTotalScoreEl.textContent = state.score;
        parentEventCountEl.textContent = state.tasks.length;
        
        const parentQuestCountEl = document.getElementById('parent-quest-count');
        if (parentQuestCountEl) {
            parentQuestCountEl.textContent = (state.sideQuests || []).length;
        }

        parentAdjCountEl.textContent = state.adjustments.length;

        renderParentEventList();
        renderParentQuestList();
        renderParentStoreList();
        renderPointsAuditLog();
    }

    // Render Parent Side Quests Management List
    function renderParentQuestList() {
        const parentQuestListEl = document.getElementById('parent-quest-list');
        if (!parentQuestListEl) return;

        parentQuestListEl.innerHTML = '';
        const quests = state.sideQuests || [];

        if (quests.length === 0) {
            parentQuestListEl.innerHTML = `<div class="empty-state">No daily side quests created. Click "⚔️ + Side Quest" to add one!</div>`;
            return;
        }

        quests.forEach(quest => {
            const card = document.createElement('div');
            card.className = 'parent-event-card quest-parent-card';

            const icon = getCategoryIcon(quest.category);

            card.innerHTML = `
                <div class="parent-event-info">
                    <div class="parent-event-title">${icon} ${quest.title}</div>
                    <div class="parent-event-meta">
                        <span class="quest-points-badge">+${quest.points} pts</span>
                        <span class="event-tag">${quest.category || 'Custom'}</span>
                        ${quest.completed ? '<span class="badge badge-success">Completed Today</span>' : ''}
                    </div>
                </div>
                <div class="parent-event-actions">
                    <button class="btn-icon edit-quest-btn" title="Edit Side Quest">✏️</button>
                    <button class="btn-danger subtract-quest-btn" title="Delete Side Quest">➖ Delete</button>
                </div>
            `;

            card.querySelector('.edit-quest-btn').addEventListener('click', () => openEditQuestModal(quest));
            card.querySelector('.subtract-quest-btn').addEventListener('click', () => deleteQuest(quest.id));

            parentQuestListEl.appendChild(card);
        });
    }

    // Render Parent Schedule Management List (With Add / Subtract controls)
    function renderParentEventList() {
        parentEventListEl.innerHTML = '';

        if (state.tasks.length === 0) {
            parentEventListEl.innerHTML = `<div class="empty-state">No events scheduled. Click "+ Add New Event" above to create one.</div>`;
            return;
        }

        state.tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'parent-event-card';

            const timeDisplay = task.targetTime ? formatTime(task.targetTime) : 'Anytime';
            const penaltyDisplay = task.penaltyPerHour > 0 ? `-${task.penaltyPerHour} pts/hr late` : 'No penalty';

            card.innerHTML = `
                <div class="parent-event-info">
                    <div class="parent-event-title">${task.title}</div>
                    <div class="parent-event-meta">
                        <span class="event-tag">${task.basePoints} pts</span>
                        <span class="event-tag">⏰ ${timeDisplay}</span>
                        <span class="event-tag">${penaltyDisplay}</span>
                        ${task.completed ? '<span class="badge badge-success">Completed Today</span>' : ''}
                    </div>
                </div>
                <div class="parent-event-actions">
                    <button class="btn-icon edit-event-btn" title="Edit Event">✏️</button>
                    <button class="btn-danger subtract-event-btn" title="Subtract/Remove Event">➖ Delete</button>
                </div>
            `;

            // Edit Event Event Listener
            card.querySelector('.edit-event-btn').addEventListener('click', () => openEditEventModal(task));

            // Subtract / Delete Event Listener
            card.querySelector('.subtract-event-btn').addEventListener('click', () => subtractEvent(task.id));

            parentEventListEl.appendChild(card);
        });
    }

    // Subtract/Delete event from schedule
    function subtractEvent(taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (confirm(`Are you sure you want to subtract "${task.title}" from the schedule?`)) {
            state.tasks = state.tasks.filter(t => t.id !== taskId);
            recalculateTotalScore();
            saveState();
            renderScheduleTasks();
            renderParentPortal();
            updateScoreDisplays();
        }
    }

    // Render Points Audit History Log
    function renderPointsAuditLog() {
        pointsHistoryListEl.innerHTML = '';

        if (state.adjustments.length === 0) {
            pointsHistoryListEl.innerHTML = `<div class="empty-state" style="font-size: 0.85rem; padding: 1rem; color: var(--text-secondary);">No manual point adjustments recorded yet.</div>`;
            return;
        }

        // Show newest first
        const sorted = [...state.adjustments].reverse();
        sorted.forEach(adj => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const isPositive = adj.type === 'add';
            const sign = isPositive ? '+' : '-';
            const amountClass = isPositive ? 'positive' : 'negative';

            item.innerHTML = `
                <div class="history-details">
                    <span class="history-reason">${adj.reason || 'Manual Adjustment'}</span>
                    <span class="history-time">${adj.timestamp}</span>
                </div>
                <span class="history-amount ${amountClass}">${sign}${adj.amount} pts</span>
            `;

            pointsHistoryListEl.appendChild(item);
        });
    }

    // Render Kid Store View
    function renderStore() {
        if (!storeListEl) return;
        storeListEl.innerHTML = '';
        if (storeTotalScoreEl) storeTotalScoreEl.textContent = state.score;
        if (kidStoreCountEl) kidStoreCountEl.textContent = `${state.storeItems.length} Item${state.storeItems.length !== 1 ? 's' : ''}`;

        if (state.storeItems.length === 0) {
            storeListEl.innerHTML = `<div class="empty-state" style="grid-column: span 2;">No rewards available yet. Ask a parent to add some!</div>`;
            return;
        }

        state.storeItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'store-card';
            
            const canAfford = state.score >= item.points;

            card.innerHTML = `
                <div class="store-icon">${item.icon || '🎁'}</div>
                <div class="store-title">${item.title}</div>
                <div class="store-cost">${item.points} pts</div>
                <button class="btn-redeem" ${canAfford ? '' : 'disabled'}>
                    ${canAfford ? 'Redeem Reward' : 'Not Enough Points'}
                </button>
            `;

            if (canAfford) {
                card.querySelector('.btn-redeem').addEventListener('click', () => purchaseItem(item));
            }

            storeListEl.appendChild(card);
        });
    }

    function purchaseItem(item) {
        if (state.score < item.points) return;
        
        if (confirm(`Are you sure you want to spend ${item.points} points on "${item.title}"?`)) {
            const now = new Date();
            const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            state.adjustments.push({
                id: `adj-${Date.now()}`,
                type: 'subtract',
                amount: item.points,
                reason: `Purchased: ${item.title}`,
                timestamp: timeStr
            });

            recalculateTotalScore();
            saveState();
            renderStore();
            renderParentPortal();
            updateScoreDisplays();
            alert(`Success! You have purchased "${item.title}". Check with a parent to claim your reward.`);
        }
    }

    // Render Parent Store Management List
    function renderParentStoreList() {
        if (!parentStoreListEl) return;
        parentStoreListEl.innerHTML = '';
        
        if (state.storeItems.length === 0) {
            parentStoreListEl.innerHTML = `<div class="empty-state">No items in the store. Click "🛒 + Store Item" above to add one.</div>`;
            return;
        }

        state.storeItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'parent-event-card';

            card.innerHTML = `
                <div class="parent-event-info">
                    <div class="parent-event-title">${item.icon || '🎁'} ${item.title}</div>
                    <div class="parent-event-meta">
                        <span class="event-tag">${item.points} pts to redeem</span>
                    </div>
                </div>
                <div class="parent-event-actions">
                    <button class="btn-icon edit-store-btn" title="Edit Store Item">✏️</button>
                    <button class="btn-danger delete-store-btn" title="Delete Store Item">➖ Delete</button>
                </div>
            `;

            card.querySelector('.edit-store-btn').addEventListener('click', () => openEditStoreModal(item));
            card.querySelector('.delete-store-btn').addEventListener('click', () => deleteStoreItem(item.id));

            parentStoreListEl.appendChild(card);
        });
    }

    function deleteStoreItem(itemId) {
        const item = state.storeItems.find(i => i.id === itemId);
        if (!item) return;

        if (confirm(`Are you sure you want to delete "${item.title}" from the store?`)) {
            state.storeItems = state.storeItems.filter(i => i.id !== itemId);
            saveState();
            renderStore();
            renderParentPortal();
        }
    }

    function openAddStoreModal() {
        const titleEl = document.getElementById('store-modal-title');
        if (titleEl) titleEl.textContent = 'Add New Store Reward';
        document.getElementById('store-edit-id').value = '';
        document.getElementById('store-title-input').value = '';
        document.getElementById('store-points-input').value = '50';
        document.getElementById('store-icon-input').value = '🎁';
        storeModal.classList.remove('hidden');
        setTimeout(() => document.getElementById('store-title-input').focus(), 100);
    }

    function openEditStoreModal(item) {
        const titleEl = document.getElementById('store-modal-title');
        if (titleEl) titleEl.textContent = 'Edit Store Reward';
        document.getElementById('store-edit-id').value = item.id;
        document.getElementById('store-title-input').value = item.title;
        document.getElementById('store-points-input').value = item.points;
        document.getElementById('store-icon-input').value = item.icon || '🎁';
        storeModal.classList.remove('hidden');
        setTimeout(() => document.getElementById('store-title-input').focus(), 100);
    }

    function closeStoreModal() {
        if (storeModal) storeModal.classList.add('hidden');
    }


    // Update total score UI displays with pop animation
    function updateScoreDisplays() {
        const currentDisplayed = parseInt(totalScoreEl.textContent, 10);
        const target = state.score;

        if (currentDisplayed !== target) {
            totalScoreEl.textContent = target;
            parentTotalScoreEl.textContent = target;
            if (storeTotalScoreEl) storeTotalScoreEl.textContent = target;

            totalScoreEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                totalScoreEl.style.transform = 'scale(1)';
            }, 200);
        }

        // Update long-term displays
        const weeklyTotal = (state.weeklyScore || 0) + state.score;
        const allTimeTotal = (state.allTimeScore || 0) + state.score;

        const weeklyDisplayEl = document.getElementById('weekly-score-display');
        const alltimeDisplayEl = document.getElementById('alltime-score-display');
        const parentWeeklyEl = document.getElementById('parent-weekly-score');
        const parentAlltimeEl = document.getElementById('parent-alltime-score');

        if (weeklyDisplayEl) weeklyDisplayEl.textContent = weeklyTotal;
        if (alltimeDisplayEl) alltimeDisplayEl.textContent = allTimeTotal;
        if (parentWeeklyEl) parentWeeklyEl.textContent = weeklyTotal;
        if (parentAlltimeEl) parentAlltimeEl.textContent = allTimeTotal;
    }

    // View Navigation Logic
    function switchToScheduleView() {
        navScheduleBtn.classList.add('active');
        if (navStoreBtn) navStoreBtn.classList.remove('active');
        navParentBtn.classList.remove('active');
        scheduleView.classList.remove('hidden');
        scheduleView.classList.add('active');
        if (storeView) {
            storeView.classList.add('hidden');
            storeView.classList.remove('active');
        }
        parentView.classList.add('hidden');
        parentView.classList.remove('active');
    }

    function switchToStoreView() {
        if (navStoreBtn) navStoreBtn.classList.add('active');
        navScheduleBtn.classList.remove('active');
        navParentBtn.classList.remove('active');
        if (storeView) {
            storeView.classList.remove('hidden');
            storeView.classList.add('active');
        }
        scheduleView.classList.add('hidden');
        scheduleView.classList.remove('active');
        parentView.classList.add('hidden');
        parentView.classList.remove('active');
        renderStore();
    }

    function switchToParentView() {
        if (!state.isParentUnlocked) {
            openPasswordModal();
            return;
        }
        navParentBtn.classList.add('active');
        navScheduleBtn.classList.remove('active');
        if (navStoreBtn) navStoreBtn.classList.remove('active');
        parentView.classList.remove('hidden');
        parentView.classList.add('active');
        scheduleView.classList.add('hidden');
        scheduleView.classList.remove('active');
        if (storeView) {
            storeView.classList.add('hidden');
            storeView.classList.remove('active');
        }
        renderParentPortal();
    }

    // Password Security Modal Functions
    function openPasswordModal() {
        passwordErrorMsg.classList.add('hidden');
        parentPasswordInput.value = '';
        parentPasswordInput.type = 'password';
        togglePassVisibilityBtn.textContent = '👁️';
        passwordModal.classList.remove('hidden');
        setTimeout(() => parentPasswordInput.focus(), 100);
    }

    function closePasswordModal() {
        passwordModal.classList.add('hidden');
    }

    function lockParentPortal() {
        state.isParentUnlocked = false;
        switchToScheduleView();
    }

    // Side Quest Modal Functions (Add & Edit)
    function openAddQuestModal() {
        const questModalTitle = document.getElementById('quest-modal-title');
        const questEditIdInput = document.getElementById('quest-edit-id');
        const questTitleInput = document.getElementById('quest-title-input');
        const questPointsInput = document.getElementById('quest-points-input');
        const questCategorySelect = document.getElementById('quest-category-select');
        const sideQuestModal = document.getElementById('sidequest-modal');

        if (!sideQuestModal) return;

        questModalTitle.textContent = 'Add New Daily Side Quest';
        questEditIdInput.value = '';
        questTitleInput.value = '';
        questPointsInput.value = '10';
        questCategorySelect.value = 'Chores';
        sideQuestModal.classList.remove('hidden');
        setTimeout(() => questTitleInput.focus(), 100);
    }

    function openEditQuestModal(quest) {
        const questModalTitle = document.getElementById('quest-modal-title');
        const questEditIdInput = document.getElementById('quest-edit-id');
        const questTitleInput = document.getElementById('quest-title-input');
        const questPointsInput = document.getElementById('quest-points-input');
        const questCategorySelect = document.getElementById('quest-category-select');
        const sideQuestModal = document.getElementById('sidequest-modal');

        if (!sideQuestModal) return;

        questModalTitle.textContent = 'Edit Daily Side Quest';
        questEditIdInput.value = quest.id;
        questTitleInput.value = quest.title;
        questPointsInput.value = quest.points;
        questCategorySelect.value = quest.category || 'Chores';
        sideQuestModal.classList.remove('hidden');
        setTimeout(() => questTitleInput.focus(), 100);
    }

    function closeQuestModal() {
        const sideQuestModal = document.getElementById('sidequest-modal');
        if (sideQuestModal) sideQuestModal.classList.add('hidden');
    }

    function deleteQuest(questId) {
        const quest = (state.sideQuests || []).find(q => q.id === questId);
        if (!quest) return;

        if (confirm(`Are you sure you want to delete side quest "${quest.title}"?`)) {
            state.sideQuests = state.sideQuests.filter(q => q.id !== questId);
            recalculateTotalScore();
            saveState();
            renderSideQuests();
            renderParentPortal();
            updateScoreDisplays();
        }
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Nav tab switches
        navScheduleBtn.addEventListener('click', switchToScheduleView);
        if (navStoreBtn) navStoreBtn.addEventListener('click', switchToStoreView);
        navParentBtn.addEventListener('click', switchToParentView);

        // Password Modal Handlers
        togglePassVisibilityBtn.addEventListener('click', () => {
            const isPass = parentPasswordInput.type === 'password';
            parentPasswordInput.type = isPass ? 'text' : 'password';
            togglePassVisibilityBtn.textContent = isPass ? '🙈' : '👁️';
        });

        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputVal = parentPasswordInput.value.trim();
            if (inputVal === state.parentPassword) {
                state.isParentUnlocked = true;
                closePasswordModal();
                switchToParentView();
            } else {
                passwordErrorMsg.classList.remove('hidden');
                parentPasswordInput.select();
            }
        });

        closePasswordModalBtn.addEventListener('click', closePasswordModal);
        cancelPasswordBtn.addEventListener('click', closePasswordModal);

        // Parent Control Buttons
        lockPortalBtn.addEventListener('click', lockParentPortal);
        changePassBtn.addEventListener('click', openChangePassModal);
        openAddEventBtn.addEventListener('click', openAddEventModal);
        if (openAddStoreBtn) openAddStoreBtn.addEventListener('click', openAddStoreModal);
        
        const openAddQuestBtn = document.getElementById('open-add-quest-btn');
        if (openAddQuestBtn) {
            openAddQuestBtn.addEventListener('click', openAddQuestModal);
        }

        openAdjustPointsBtn.addEventListener('click', openPointsModal);

        // Store Modal Events
        if (storeForm) {
            storeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const editId = document.getElementById('store-edit-id').value;
                const title = document.getElementById('store-title-input').value.trim();
                const points = parseInt(document.getElementById('store-points-input').value, 10) || 50;
                const icon = document.getElementById('store-icon-input').value.trim() || '🎁';

                if (!title) return;

                if (!Array.isArray(state.storeItems)) state.storeItems = [];

                if (editId) {
                    const item = state.storeItems.find(i => i.id === editId);
                    if (item) {
                        item.title = title;
                        item.points = points;
                        item.icon = icon;
                    }
                } else {
                    state.storeItems.push({
                        id: `store-${Date.now()}`,
                        title,
                        points,
                        icon
                    });
                }

                saveState();
                renderStore();
                renderParentPortal();
                closeStoreModal();
            });
        }
        if (closeStoreModalBtn) closeStoreModalBtn.addEventListener('click', closeStoreModal);
        if (cancelStoreBtn) cancelStoreBtn.addEventListener('click', closeStoreModal);

        // Event Modal Submit (Save Event)
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = eventEditIdInput.value;
            const title = eventTitleInput.value.trim();
            const basePoints = parseInt(eventPointsInput.value, 10) || 0;
            const targetTime = eventTimeInput.value || null;
            const penaltyPerHour = parseInt(eventPenaltyInput.value, 10) || 0;

            if (!title) return;

            if (editId) {
                // Update existing
                const task = state.tasks.find(t => t.id === editId);
                if (task) {
                    task.title = title;
                    task.basePoints = basePoints;
                    task.targetTime = targetTime;
                    task.penaltyPerHour = penaltyPerHour;
                }
            } else {
                // Add new task
                const newTask = {
                    id: `task-${Date.now()}`,
                    title,
                    basePoints,
                    targetTime,
                    penaltyPerHour,
                    completed: false,
                    pointsEarned: 0,
                    completedAt: null
                };
                state.tasks.push(newTask);
            }

            recalculateTotalScore();
            saveState();
            renderScheduleTasks();
            renderParentPortal();
            updateScoreDisplays();
            closeEventModal();
        });

        closeEventModalBtn.addEventListener('click', closeEventModal);
        cancelEventBtn.addEventListener('click', closeEventModal);

        // Side Quest Modal Handlers
        const closeQuestModalBtn = document.getElementById('close-quest-modal');
        const cancelQuestBtn = document.getElementById('cancel-quest-btn');
        const questForm = document.getElementById('quest-form');

        if (closeQuestModalBtn) closeQuestModalBtn.addEventListener('click', closeQuestModal);
        if (cancelQuestBtn) cancelQuestBtn.addEventListener('click', closeQuestModal);

        if (questForm) {
            questForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const editId = document.getElementById('quest-edit-id').value;
                const title = document.getElementById('quest-title-input').value.trim();
                const points = parseInt(document.getElementById('quest-points-input').value, 10) || 10;
                const category = document.getElementById('quest-category-select').value;

                if (!title) return;

                if (!Array.isArray(state.sideQuests)) state.sideQuests = [];

                if (editId) {
                    const quest = state.sideQuests.find(q => q.id === editId);
                    if (quest) {
                        quest.title = title;
                        quest.points = points;
                        quest.category = category;
                    }
                } else {
                    const newQuest = {
                        id: `sq-${Date.now()}`,
                        title,
                        points,
                        category,
                        completed: false,
                        completedAt: null
                    };
                    state.sideQuests.push(newQuest);
                }

                recalculateTotalScore();
                saveState();
                renderSideQuests();
                renderParentPortal();
                updateScoreDisplays();
                closeQuestModal();
            });
        }

        // Quick Preset Chip Listeners
        document.querySelectorAll('.preset-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const title = chip.getAttribute('data-title');
                const pts = chip.getAttribute('data-points');
                const cat = chip.getAttribute('data-cat');
                
                const titleInput = document.getElementById('quest-title-input');
                const pointsInput = document.getElementById('quest-points-input');
                const categorySelect = document.getElementById('quest-category-select');

                if (titleInput && title) titleInput.value = title;
                if (pointsInput && pts) pointsInput.value = pts;
                if (categorySelect && cat) categorySelect.value = cat;
            });
        });

        // Points Form Submit (Apply Manual Adjustment)
        pointsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.querySelector('input[name="adjust-type"]:checked').value;
            const amount = parseInt(pointsAmountInput.value, 10) || 0;
            const reason = pointsReasonInput.value.trim() || (type === 'add' ? 'Bonus Points' : 'Penalty Deduction');

            if (amount <= 0) return;

            const now = new Date();
            const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            state.adjustments.push({
                id: `adj-${Date.now()}`,
                type,
                amount,
                reason,
                timestamp: timeStr
            });

            recalculateTotalScore();
            saveState();
            renderParentPortal();
            updateScoreDisplays();
            closePointsModal();
        });

        closePointsModalBtn.addEventListener('click', closePointsModal);
        cancelPointsBtn.addEventListener('click', closePointsModal);

        // Change Password Form Submit
        changePassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const curr = currentPassInput.value.trim();
            const newP = newPassInput.value.trim();
            const confP = confirmPassInput.value.trim();

            if (curr !== state.parentPassword) {
                passChangeError.textContent = 'Current password is incorrect.';
                passChangeError.classList.remove('hidden');
                return;
            }

            if (!newP) {
                passChangeError.textContent = 'New password cannot be blank.';
                passChangeError.classList.remove('hidden');
                return;
            }

            if (newP !== confP) {
                passChangeError.textContent = 'New passwords do not match.';
                passChangeError.classList.remove('hidden');
                return;
            }

            state.parentPassword = newP;
            saveState();
            closeChangePassModal();
            alert('Parent password successfully updated!');
        });

        closeChangePassModalBtn.addEventListener('click', closeChangePassModal);
        cancelChangePassBtn.addEventListener('click', closeChangePassModal);

        // Reset Day Button (Kid View)
        resetBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset today's task completions?")) {
                state.tasks.forEach(t => {
                    t.completed = false;
                    t.pointsEarned = 0;
                    t.completedAt = null;
                });
                if (Array.isArray(state.sideQuests)) {
                    state.sideQuests.forEach(q => {
                        q.completed = false;
                        q.completedAt = null;
                    });
                }
                recalculateTotalScore();
                saveState();
                renderScheduleTasks();
                renderSideQuests();
                renderParentPortal();
                updateScoreDisplays();
            }
        });
    }

    // Run Initialization
    init();
});

