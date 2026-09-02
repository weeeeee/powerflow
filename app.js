import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { doc, setDoc, onSnapshot, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AI" + "zaSyAkUjpBHzVgb2UyCiIeaAGIj_A-vBz3YH0",
  authDomain: "powerflowadhd.firebaseapp.com",
  projectId: "powerflowadhd",
  storageBucket: "powerflowadhd.firebasestorage.app",
  messagingSenderId: "173956659319",
  appId: "1:173956659319:web:3d07d6df6af776aedc2e72",
  measurementId: "G-29F7SNRZ77"
};

const app = initializeApp(firebaseConfig);

// Multi-tab IndexedDB persistence isn't reliably supported on every browser
// (notably Safari/WebKit - i.e. every browser on iOS). If it throws here, this
// whole module fails to load and the app never syncs at all, with no visible
// error. Fall back to a plain (network-only, no offline cache) connection so
// the app still works everywhere, just without offline persistence there.
let db;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
} catch (e) {
    console.error("Persistent multi-tab Firestore cache unavailable, falling back to network-only mode:", e);
    db = getFirestore(app);
}

document.addEventListener('DOMContentLoaded', () => {
    // Default initial tasks if none exist in localStorage
    const defaultTasks = [
        {
            id: 'task-1',
            title: 'Wake up at 8 AM',
            basePoints: 5,
            targetTime: '08:00',
            penaltyPerHour: 1,
            levelRequired: 'Novice',
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
            levelRequired: 'Novice',
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
            levelRequired: 'Novice',
            completed: false,
            pointsEarned: 0,
            completedAt: null
        }
    ];

    const defaultSideQuests = [
        {
            id: 'sq-1',
            title: 'Organize Bedroom Toys',
            points: 10,
            category: 'Chores',
            notes: 'Make sure all toys are in the bin.',
            completed: false,
            completedAt: null
        },
        {
            id: 'sq-2',
            title: 'Read Extra 15 Mins',
            points: 15,
            category: 'Learning',
            notes: '',
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
    let isStateStale = true;
    let lastTick = Date.now();
    let state = {
        score: 0,
        weeklyScore: 0,
        allTimeScore: 0,
        currentRank: 'Novice',
        completedDaysThisWeek: 0,
        cycleStartDate: new Date().toDateString(),
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

    // DOM Elements - Calendar
    const openCalendarBtn = document.getElementById('open-calendar-btn');
    const calendarModal = document.getElementById('calendar-modal');
    const closeCalendarModalBtn = document.getElementById('close-calendar-modal');
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calPrevMonthBtn = document.getElementById('cal-prev-month');
    const calNextMonthBtn = document.getElementById('cal-next-month');

    // DOM Elements - Monthly Report
    const openReportBtn = document.getElementById('open-report-btn');
    const reportModal = document.getElementById('report-modal');
    const closeReportModalBtn = document.getElementById('close-report-modal');
    const closeReportBtn = document.getElementById('close-report-btn');
    const reportPrevMonthBtn = document.getElementById('report-prev-month');
    const reportNextMonthBtn = document.getElementById('report-next-month');
    const reportMonthYear = document.getElementById('report-month-year');
    const reportSummaryGrid = document.getElementById('report-summary-grid');
    const reportChartCanvas = document.getElementById('report-chart-canvas');
    const reportTableBody = document.getElementById('report-table-body');
    const downloadReportBtn = document.getElementById('download-report-btn');

    // DOM Elements - Historical Day Detail
    const dayDetailModal = document.getElementById('day-detail-modal');
    const closeDayDetailModalBtn = document.getElementById('close-day-detail-modal');
    const backToCalendarBtn = document.getElementById('back-to-calendar-btn');
    const dayDetailTitle = document.getElementById('day-detail-title');
    const dayDetailRank = document.getElementById('day-detail-rank');
    const dayDetailTasks = document.getElementById('day-detail-tasks');
    const dayDetailQuests = document.getElementById('day-detail-quests');

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
        // Listen to Firestore for real-time state changes
        onSnapshot(doc(db, "users", "defaultFamily"), { includeMetadataChanges: true }, (docSnap) => {
            if (docSnap.exists()) {
                const parsed = docSnap.data();
                
                state = { ...state, ...parsed };
                
                // Backup to localStorage
                localStorage.setItem('powerflow_state', JSON.stringify(state));
                // Ensure arrays exist
                if (!Array.isArray(state.tasks)) state.tasks = defaultTasks;
                if (!Array.isArray(state.sideQuests)) state.sideQuests = defaultSideQuests;
                if (!Array.isArray(state.storeItems)) state.storeItems = defaultStoreItems;
                if (!Array.isArray(state.adjustments)) state.adjustments = [];
                if (!state.history) state.history = {}; // Initialize history log
                if (!state.parentPassword) state.parentPassword = '1234';
                if (typeof state.weeklyScore !== 'number') state.weeklyScore = 0;
                if (typeof state.allTimeScore !== 'number') state.allTimeScore = 0;
                if (!state.currentRank) state.currentRank = 'Novice';
                if (typeof state.completedDaysThisWeek !== 'number') state.completedDaysThisWeek = 0;
                if (!state.cycleStartDate) state.cycleStartDate = state.lastResetDate || new Date().toDateString();
                backfillAllTasksCompleted(state.history);
            } else {
                // Initial creation / migration from localStorage
                const localState = localStorage.getItem('powerflow_state');
                if (localState) {
                    try {
                        const parsed = JSON.parse(localState);
                        state = { ...state, ...parsed };
                        if (!Array.isArray(state.tasks)) state.tasks = defaultTasks;
                        if (!Array.isArray(state.sideQuests)) state.sideQuests = defaultSideQuests;
                        if (!Array.isArray(state.storeItems)) state.storeItems = defaultStoreItems;
                        if (!Array.isArray(state.adjustments)) state.adjustments = [];
                        if (!state.history) state.history = {}; // Initialize history log
                        if (!state.parentPassword) state.parentPassword = '1234';
                    } catch (e) {
                        console.error("Failed to parse local state:", e);
                    }
                }
                saveState(); // push initial state to firestore
            }
            
            // Re-render UI with new state
            isStateStale = false;
            checkDailyReset();

            recalculateTotalScore();
            renderDate();
            renderScheduleTasks();
            renderSideQuests();
            renderStore();
            renderParentPortal();
            if (typeof updateScoreDisplays === 'function') updateScoreDisplays();
            updateRankProgressDisplay();
        }, (error) => {
            console.error("Firebase listen error:", error);
        });

        startLiveClock();
        setupEventListeners();
    }

    // Save state to Firestore
    function saveState() {
        state.lastModified = Date.now();
        const stateToSave = {
            score: state.score,
            weeklyScore: state.weeklyScore,
            allTimeScore: state.allTimeScore,
            currentRank: state.currentRank,
            completedDaysThisWeek: state.completedDaysThisWeek,
            cycleStartDate: state.cycleStartDate,
            parentPassword: state.parentPassword,
            lastResetDate: state.lastResetDate,
            tasks: state.tasks,
            sideQuests: state.sideQuests,
            storeItems: state.storeItems,
            adjustments: state.adjustments,
            history: state.history || {},
            lastModified: state.lastModified
        };
        
        setDoc(doc(db, "users", "defaultFamily"), stateToSave).catch(err => {
            console.error("Error saving state to Firestore:", err);
        });
        
        // Also backup to local storage just in case
        localStorage.setItem('powerflow_state', JSON.stringify(stateToSave));
    }

    // Update Rank Progress Bar Display
    function updateRankProgressDisplay() {
        const progressContainer = document.getElementById('level-progress-container');
        const progressText = document.getElementById('level-progress-text');
        const progressFill = document.getElementById('level-progress-fill');
        
        if (!progressContainer || !progressText || !progressFill) return;
        
        if (state.currentRank === 'Prestige') {
            progressText.textContent = 'Max Rank Achieved!';
            progressFill.style.width = '100%';
            progressFill.style.background = 'linear-gradient(90deg, #8b5cf6, #ec4899)'; // prestige colors
        } else {
            const days = state.completedDaysThisWeek || 0;
            progressText.textContent = `${days}/5 Days`;
            const percentage = Math.min((days / 5) * 100, 100);
            progressFill.style.width = `${percentage}%`;
            progressFill.style.background = 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))';
        }
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
        
        saveDailySnapshot();
    }

    // Save a snapshot of the current day's progress
    function saveDailySnapshot() {
        if (!state.history) state.history = {};
        const todayStr = new Date().toDateString();
        
        // Don't overwrite if checkDailyReset is currently processing a new day and hasn't updated lastResetDate yet
        if (state.lastResetDate !== todayStr) return; 

        state.history[todayStr] = {
            date: todayStr,
            score: state.score,
            rank: state.currentRank,
            tasks: JSON.parse(JSON.stringify(state.tasks)),
            sideQuests: JSON.parse(JSON.stringify(state.sideQuests || []))
        };
    }

    // Helper to count whole days between two dates
    function daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        // Normalize to midnight
        d1.setHours(0,0,0,0);
        d2.setHours(0,0,0,0);

        return Math.round((d2.getTime() - d1.getTime()) / 86400000);
    }

    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Helper to get rank numeric value
    function getRankValue(rank) {
        const ranks = { 'Novice': 1, 'Veteran': 2, 'Master': 3, 'Prestige': 4 };
        return ranks[rank] || 1;
    }

    // One-time migration for history entries recorded before allTasksCompleted was
    // tracked, so a later edit diffs against their real prior state instead of
    // assuming "not completed" and potentially double-crediting the streak.
    function backfillAllTasksCompleted(history) {
        if (!history) return;
        Object.values(history).forEach(entry => {
            if (typeof entry.allTasksCompleted === 'boolean' || entry.unrecorded) return;
            const rankVal = getRankValue(entry.rank || 'Novice');
            const activeTasks = (entry.tasks || []).filter(t => getRankValue(t.levelRequired || 'Novice') <= rankVal);
            entry.allTasksCompleted = activeTasks.length > 0 && activeTasks.every(t => t.completed);
        });
    }

    // Count the consecutive run of fully-completed days ending at fromDateStr,
    // walking backward through history. Any missed/unrecorded day stops the count,
    // and it never looks earlier than cycleStartDate (an already-consumed streak,
    // e.g. from a past rank-up, shouldn't keep inflating a later one).
    function computeCurrentStreak(fromDateStr) {
        let streak = 0;
        const floor = state.cycleStartDate ? new Date(state.cycleStartDate).getTime() : 0;
        let d = new Date(fromDateStr);
        d.setHours(0, 0, 0, 0);

        while (d.getTime() >= floor) {
            const entry = state.history && state.history[d.toDateString()];
            if (!entry || !entry.allTasksCompleted) break;
            streak++;
            d.setDate(d.getDate() - 1);
        }
        return streak;
    }

    // Promote rank and grant the bonus if the streak requirement was met.
    // Shared by checkDailyReset() and retroactive edits to a past day's tasks.
    function applyRankUpIfEligible() {
        if ((state.completedDaysThisWeek || 0) < 5 || state.currentRank === 'Prestige') return;

        const nextRank = { 'Novice': 'Veteran', 'Veteran': 'Master', 'Master': 'Prestige', 'Prestige': 'Prestige' };
        state.currentRank = nextRank[state.currentRank || 'Novice'] || 'Veteran';

        const now = new Date();
        const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        state.adjustments.push({
            id: `adj-levelup-${Date.now()}`,
            type: 'add',
            amount: 200,
            reason: 'Level Up Bonus!',
            timestamp: timeStr
        });
    }

    // Reset daily tasks & side quests if a new day has started
    function checkDailyReset() {
        const todayStr = new Date().toDateString();
        const todayTime = new Date(todayStr).getTime();
        const lastResetTime = state.lastResetDate ? new Date(state.lastResetDate).getTime() : 0;

        if (todayTime > lastResetTime) {
            const previousScore = state.score || 0;

            // Check if all active main quest tasks were completed yesterday
            const currentRankVal = getRankValue(state.currentRank || 'Novice');
            const activeTasks = state.tasks.filter(t => getRankValue(t.levelRequired || 'Novice') <= currentRankVal);
            const allTasksCompleted = activeTasks.length > 0 && activeTasks.every(t => t.completed);

            // Add previous day's score to all-time
            state.allTimeScore = (state.allTimeScore || 0) + previousScore;

            if (!state.cycleStartDate) state.cycleStartDate = state.lastResetDate;

            // Figure out which real calendar day the live task/score data actually
            // belongs to. If the tab stayed open (or ran stale cached JS) across a
            // midnight boundary without ever detecting the date change, lastResetDate
            // can be stale while state.tasks reflects activity from a later day.
            // lastModified (updated on every save) is a reliable stamp of when that
            // activity actually happened, so prefer it - clamped to the open gap -
            // over blindly trusting the stale lastResetDate.
            let dataDate = state.lastResetDate;
            if (state.lastModified) {
                const modifiedDateStr = new Date(state.lastModified).toDateString();
                const modifiedTime = new Date(modifiedDateStr).getTime();
                if (modifiedTime > lastResetTime && modifiedTime < todayTime) {
                    dataDate = modifiedDateStr;
                }
            }

            // Save final snapshot for the day the data actually belongs to
            if (!state.history) state.history = {};
            state.history[dataDate] = {
                date: dataDate,
                score: previousScore,
                rank: state.currentRank,
                tasks: JSON.parse(JSON.stringify(state.tasks)),
                sideQuests: JSON.parse(JSON.stringify(state.sideQuests || [])),
                allTasksCompleted
            };

            // Any other days in the gap (before or after the real data day) had no
            // tracked activity at all - mark them explicitly instead of silently
            // skipping them.
            const skippedDays = daysBetween(state.lastResetDate, todayStr) - 1;
            for (let i = 1; i <= skippedDays; i++) {
                const skippedDate = new Date(state.lastResetDate);
                skippedDate.setDate(skippedDate.getDate() + i);
                const skippedDateStr = skippedDate.toDateString();
                if (skippedDateStr === dataDate) continue;
                if (!state.history[skippedDateStr]) {
                    state.history[skippedDateStr] = {
                        date: skippedDateStr,
                        score: 0,
                        rank: state.currentRank,
                        tasks: [],
                        sideQuests: [],
                        unrecorded: true
                    };
                }
            }

            // A true consecutive streak: any missed (or unrecorded) day breaks it
            // immediately rather than just failing to add to a cumulative count.
            state.completedDaysThisWeek = computeCurrentStreak(dataDate);

            if (state.completedDaysThisWeek >= 5) {
                applyRankUpIfEligible();
                state.completedDaysThisWeek = 0;
                state.weeklyScore = 0; // Fresh streak, it doesn't include yesterday
                state.cycleStartDate = todayStr;
            } else if (!allTasksCompleted) {
                // Streak broken - start counting fresh from today
                state.weeklyScore = 0;
                state.cycleStartDate = todayStr;
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
            const nowTime = Date.now();
            if (nowTime - lastTick > 60000) {
                isStateStale = true; // Mark stale if computer likely slept
            }
            lastTick = nowTime;

            const now = new Date();
            let h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, '0');
            const s = now.getSeconds().toString().padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            liveTimeEl.textContent = `${h}:${m}:${s} ${ampm}`;

            // Check for date change while app is open
            if (state.lastResetDate && state.lastResetDate !== new Date().toDateString()) {
                if (!isStateStale) {
                    checkDailyReset();
                    renderScheduleTasks();
                    renderSideQuests();
                    renderParentPortal();
                }
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
            const now = new Date();
            let completedTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

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
        
        const currentRankVal = getRankValue(state.currentRank || 'Novice');
        const activeTasks = state.tasks.filter(t => getRankValue(t.levelRequired || 'Novice') <= currentRankVal);

        kidTaskCountEl.textContent = `${activeTasks.length} Step${activeTasks.length !== 1 ? 's' : ''}`;

        if (activeTasks.length === 0) {
            taskListEl.innerHTML = `<div class="empty-state">No main quest steps available. Ask a parent to add tasks!</div>`;
            return;
        }

        activeTasks.forEach(task => {
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

        const allTasksCompleted = activeTasks.length > 0 && activeTasks.every(t => t.completed);
        if (allTasksCompleted) {
            const completionMsg = document.createElement('div');
            completionMsg.className = 'empty-state';
            completionMsg.style.color = 'var(--success-color, #10b981)';
            completionMsg.style.fontWeight = 'bold';
            completionMsg.style.marginTop = '1rem';
            completionMsg.innerHTML = '🎉 Main Quest Completed For Today! 🎉';
            taskListEl.appendChild(completionMsg);
        }
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
            const now = new Date();
            let completedTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
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
                    ${quest.notes ? `<div class="task-notes" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${quest.notes}</div>` : ''}
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
                    ${quest.notes ? `<div class="parent-event-notes" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${quest.notes}</div>` : ''}
                    <div class="parent-event-meta">
                        <span class="quest-points-badge">+${quest.points} pts</span>
                        <span class="event-tag">${quest.category || 'Custom'}</span>
                        ${quest.completed ? '<span class="badge badge-success">Completed Today</span>' : ''}
                    </div>
                </div>
                <div class="parent-event-actions">
                    <button class="btn-icon move-up-btn" title="Move Up">⬆️</button>
                    <button class="btn-icon move-down-btn" title="Move Down">⬇️</button>
                    <button class="btn-icon edit-quest-btn" title="Edit Side Quest">✏️</button>
                    <button class="btn-danger subtract-quest-btn" title="Delete Side Quest">➖ Delete</button>
                </div>
            `;

            card.querySelector('.move-up-btn').addEventListener('click', () => moveItem('sideQuests', quest.id, -1));
            card.querySelector('.move-down-btn').addEventListener('click', () => moveItem('sideQuests', quest.id, 1));
            card.querySelector('.edit-quest-btn').addEventListener('click', () => openEditQuestModal(quest));
            card.querySelector('.subtract-quest-btn').addEventListener('click', () => deleteQuest(quest.id));

            parentQuestListEl.appendChild(card);
        });
    }

    // Move item up or down in its array
    function moveItem(arrayName, itemId, direction) {
        const arr = state[arrayName];
        if (!arr) return;
        const index = arr.findIndex(item => item.id === itemId);
        if (index < 0) return;
        
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= arr.length) return;
        
        const temp = arr[index];
        arr[index] = arr[newIndex];
        arr[newIndex] = temp;
        
        saveState();
        if (arrayName === 'tasks') {
            renderScheduleTasks();
            renderParentEventList();
        } else if (arrayName === 'sideQuests') {
            renderSideQuests();
            renderParentQuestList();
        } else if (arrayName === 'storeItems') {
            renderStore();
            renderParentStoreList();
        }
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
                        <span class="event-tag">${task.levelRequired || 'Novice'}</span>
                        <span class="event-tag">${task.basePoints} pts</span>
                        <span class="event-tag">⏰ ${timeDisplay}</span>
                        <span class="event-tag">${penaltyDisplay}</span>
                        ${task.completed ? '<span class="badge badge-success">Completed Today</span>' : ''}
                    </div>
                </div>
                <div class="parent-event-actions">
                    <button class="btn-icon move-up-btn" title="Move Up">⬆️</button>
                    <button class="btn-icon move-down-btn" title="Move Down">⬇️</button>
                    <button class="btn-icon edit-event-btn" title="Edit Event">✏️</button>
                    <button class="btn-danger subtract-event-btn" title="Subtract/Remove Event">➖ Delete</button>
                </div>
            `;

            card.querySelector('.move-up-btn').addEventListener('click', () => moveItem('tasks', task.id, -1));
            card.querySelector('.move-down-btn').addEventListener('click', () => moveItem('tasks', task.id, 1));

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
        const totalAvailable = (state.allTimeScore || 0) + state.score;
        if (storeTotalScoreEl) storeTotalScoreEl.textContent = totalAvailable;
        if (kidStoreCountEl) kidStoreCountEl.textContent = `${state.storeItems.length} Item${state.storeItems.length !== 1 ? 's' : ''}`;

        if (state.storeItems.length === 0) {
            storeListEl.innerHTML = `<div class="empty-state" style="grid-column: span 2;">No rewards available yet. Ask a parent to add some!</div>`;
            return;
        }

        state.storeItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'store-card';
            
            const isAvailable = item.isAvailable !== false;
            const canAfford = isAvailable && totalAvailable >= item.points;

            card.innerHTML = `
                <div class="store-icon">${item.icon || '🎁'}</div>
                <div class="store-title">${item.title}</div>
                <div class="store-cost">${item.points} pts</div>
                <button class="btn-redeem" ${canAfford ? '' : 'disabled'} style="${!isAvailable ? 'background: rgba(255,255,255,0.1); color: var(--text-secondary); cursor: not-allowed; box-shadow: none;' : ''}">
                    ${!isAvailable ? 'Currently Unavailable' : (canAfford ? 'Redeem Reward' : 'Not Enough Points')}
                </button>
            `;

            if (canAfford) {
                card.querySelector('.btn-redeem').addEventListener('click', () => purchaseItem(item));
            }

            storeListEl.appendChild(card);
        });
    }

    function purchaseItem(item) {
        const totalAvailable = (state.allTimeScore || 0) + state.score;
        if (totalAvailable < item.points) return;
        
        if (confirm(`Are you sure you want to spend ${item.points} points on "${item.title}"?`)) {
            const now = new Date();
            const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            state.allTimeScore = (state.allTimeScore || 0) - item.points;

            state.adjustments.push({
                id: `adj-${Date.now()}`,
                type: 'spend',
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

            const isAvailable = item.isAvailable !== false;
            const availBadge = isAvailable ? '' : '<span class="badge badge-danger" style="margin-left: 0.5rem;">Unavailable</span>';

            card.innerHTML = `
                <div class="parent-event-info">
                    <div class="parent-event-title">${item.icon || '🎁'} ${item.title} ${availBadge}</div>
                    <div class="parent-event-meta">
                        <span class="event-tag">${item.points} pts to redeem</span>
                    </div>
                </div>
                <div class="parent-event-actions">
                    <button class="btn-icon move-up-btn" title="Move Up">⬆️</button>
                    <button class="btn-icon move-down-btn" title="Move Down">⬇️</button>
                    <button class="btn-icon edit-store-btn" title="Edit Store Item">✏️</button>
                    <button class="btn-danger delete-store-btn" title="Delete Store Item">➖ Delete</button>
                </div>
            `;

            card.querySelector('.move-up-btn').addEventListener('click', () => moveItem('storeItems', item.id, -1));
            card.querySelector('.move-down-btn').addEventListener('click', () => moveItem('storeItems', item.id, 1));
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
        const availInput = document.getElementById('store-available-input');
        if (availInput) availInput.checked = true;
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
        const availInput = document.getElementById('store-available-input');
        if (availInput) availInput.checked = item.isAvailable !== false;
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

        // Apply rank crest CSS class
        const scoreCircle = document.querySelector('.score-circle');
        if (scoreCircle) {
            scoreCircle.classList.remove('crest-veteran', 'crest-master', 'crest-prestige');
            if (state.currentRank === 'Veteran') scoreCircle.classList.add('crest-veteran');
            else if (state.currentRank === 'Master') scoreCircle.classList.add('crest-master');
            else if (state.currentRank === 'Prestige') scoreCircle.classList.add('crest-prestige');
        }

        const badgeEl = document.getElementById('current-rank-badge');
        if (badgeEl) {
            badgeEl.className = `badge-rank ${state.currentRank.toLowerCase()}`;
            badgeEl.textContent = state.currentRank;
        }

        if (currentDisplayed !== target) {
            totalScoreEl.textContent = target;
            parentTotalScoreEl.textContent = target;

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

        if (storeTotalScoreEl) storeTotalScoreEl.textContent = allTimeTotal;
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

    // Event Modal Functions
    function openAddEventModal() {
        if (eventModalTitle) eventModalTitle.textContent = 'Add New Main Quest Step';
        eventEditIdInput.value = '';
        eventTitleInput.value = '';
        eventPointsInput.value = '5';
        eventTimeInput.value = '';
        eventPenaltyInput.value = '1';
        const rankSelect = document.getElementById('event-rank-select');
        if (rankSelect) rankSelect.value = 'Novice';
        eventModal.classList.remove('hidden');
        setTimeout(() => eventTitleInput.focus(), 100);
    }

    function openEditEventModal(task) {
        if (eventModalTitle) eventModalTitle.textContent = 'Edit Main Quest Step';
        eventEditIdInput.value = task.id;
        eventTitleInput.value = task.title;
        eventPointsInput.value = task.basePoints;
        eventTimeInput.value = task.targetTime || '';
        eventPenaltyInput.value = task.penaltyPerHour;
        const rankSelect = document.getElementById('event-rank-select');
        if (rankSelect) rankSelect.value = task.levelRequired || 'Novice';
        eventModal.classList.remove('hidden');
        setTimeout(() => eventTitleInput.focus(), 100);
    }

    function closeEventModal() {
        eventModal.classList.add('hidden');
    }

    // Change Password Modal Functions
    function openChangePassModal() {
        const currInput = document.getElementById('current-pass-input');
        if (currInput) currInput.value = '';
        const newInput = document.getElementById('new-pass-input');
        if (newInput) newInput.value = '';
        const confInput = document.getElementById('confirm-pass-input');
        if (confInput) confInput.value = '';
        const errorEl = document.getElementById('pass-change-error');
        if (errorEl) errorEl.classList.add('hidden');
        if (changePassModal) changePassModal.classList.remove('hidden');
        setTimeout(() => { if (currInput) currInput.focus(); }, 100);
    }

    function closeChangePassModal() {
        if (changePassModal) changePassModal.classList.add('hidden');
    }

    // Adjust Points Modal Functions
    function openPointsModal() {
        if (pointsAmountInput) pointsAmountInput.value = '5';
        if (pointsReasonInput) pointsReasonInput.value = '';
        if (pointsModal) pointsModal.classList.remove('hidden');
        setTimeout(() => { if (pointsAmountInput) pointsAmountInput.focus(); }, 100);
    }

    function closePointsModal() {
        if (pointsModal) pointsModal.classList.add('hidden');
    }

    // Side Quest Modal Functions (Add & Edit)
    function openAddQuestModal() {
        const questModalTitle = document.getElementById('quest-modal-title');
        const questEditIdInput = document.getElementById('quest-edit-id');
        const questTitleInput = document.getElementById('quest-title-input');
        const questPointsInput = document.getElementById('quest-points-input');
        const questCategorySelect = document.getElementById('quest-category-select');
        const questNotesInput = document.getElementById('quest-notes-input');
        const sideQuestModal = document.getElementById('sidequest-modal');

        if (!sideQuestModal) return;

        questModalTitle.textContent = 'Add New Daily Side Quest';
        questEditIdInput.value = '';
        questTitleInput.value = '';
        questPointsInput.value = '10';
        questCategorySelect.value = 'Chores';
        if (questNotesInput) questNotesInput.value = '';
        sideQuestModal.classList.remove('hidden');
        setTimeout(() => questTitleInput.focus(), 100);
    }

    function openEditQuestModal(quest) {
        const questModalTitle = document.getElementById('quest-modal-title');
        const questEditIdInput = document.getElementById('quest-edit-id');
        const questTitleInput = document.getElementById('quest-title-input');
        const questPointsInput = document.getElementById('quest-points-input');
        const questCategorySelect = document.getElementById('quest-category-select');
        const questNotesInput = document.getElementById('quest-notes-input');
        const sideQuestModal = document.getElementById('sidequest-modal');

        if (!sideQuestModal) return;

        questModalTitle.textContent = 'Edit Daily Side Quest';
        questEditIdInput.value = quest.id;
        questTitleInput.value = quest.title;
        questPointsInput.value = quest.points;
        questCategorySelect.value = quest.category || 'Chores';
        if (questNotesInput) questNotesInput.value = quest.notes || '';
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
                const availInput = document.getElementById('store-available-input');
                const isAvailable = availInput ? availInput.checked : true;

                if (!title) return;

                if (!Array.isArray(state.storeItems)) state.storeItems = [];

                if (editId) {
                    const item = state.storeItems.find(i => i.id === editId);
                    if (item) {
                        item.title = title;
                        item.points = points;
                        item.icon = icon;
                        item.isAvailable = isAvailable;
                    }
                } else {
                    state.storeItems.push({
                        id: `store-${Date.now()}`,
                        title,
                        points,
                        icon,
                        isAvailable
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
            const rankSelect = document.getElementById('event-rank-select');
            const levelRequired = rankSelect ? rankSelect.value : 'Novice';

            if (!title) return;

            if (editId) {
                // Update existing
                const task = state.tasks.find(t => t.id === editId);
                if (task) {
                    task.title = title;
                    task.basePoints = basePoints;
                    task.targetTime = targetTime;
                    task.penaltyPerHour = penaltyPerHour;
                    task.levelRequired = levelRequired;
                }
            } else {
                // Add new task
                const newTask = {
                    id: `task-${Date.now()}`,
                    title,
                    basePoints,
                    targetTime,
                    penaltyPerHour,
                    levelRequired,
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
                const notesInput = document.getElementById('quest-notes-input');
                const notes = notesInput ? notesInput.value.trim() : '';

                if (!title) return;

                if (!Array.isArray(state.sideQuests)) state.sideQuests = [];

                if (editId) {
                    const quest = state.sideQuests.find(q => q.id === editId);
                    if (quest) {
                        quest.title = title;
                        quest.points = points;
                        quest.category = category;
                        quest.notes = notes;
                    }
                } else {
                    const newQuest = {
                        id: `sq-${Date.now()}`,
                        title,
                        points,
                        category,
                        notes,
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
                const notesInput = document.getElementById('quest-notes-input');

                if (titleInput && title) titleInput.value = title;
                if (pointsInput && pts) pointsInput.value = pts;
                if (categorySelect && cat) categorySelect.value = cat;
                if (notesInput) notesInput.value = '';
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

        // Calendar Event Listeners
        openCalendarBtn.addEventListener('click', openCalendarModal);
        closeCalendarModalBtn.addEventListener('click', closeCalendarModal);
        calPrevMonthBtn.addEventListener('click', () => changeMonth(-1));
        calNextMonthBtn.addEventListener('click', () => changeMonth(1));
        
        closeDayDetailModalBtn.addEventListener('click', closeDayDetailModal);
        backToCalendarBtn.addEventListener('click', () => {
            closeDayDetailModal();
            openCalendarModal();
        });

        // Monthly Report Event Listeners
        openReportBtn.addEventListener('click', openReportModal);
        closeReportModalBtn.addEventListener('click', closeReportModalWindow);
        closeReportBtn.addEventListener('click', closeReportModalWindow);
        reportPrevMonthBtn.addEventListener('click', () => changeReportMonth(-1));
        reportNextMonthBtn.addEventListener('click', () => changeReportMonth(1));
        downloadReportBtn.addEventListener('click', downloadReportPDF);
    }

    // --- Historical Calendar Logic ---
    let currentCalendarDate = new Date();

    function openCalendarModal() {
        calendarModal.classList.remove('hidden');
        renderCalendar();
    }

    function closeCalendarModal() {
        calendarModal.classList.add('hidden');
    }

    function changeMonth(direction) {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
        renderCalendar();
    }

    function renderCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        calendarMonthYear.textContent = `${MONTH_NAMES[month]} ${year}`;
        
        calendarGrid.innerHTML = '';
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Blank days before start of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDiv);
        }
        
        const now = new Date();
        now.setHours(0,0,0,0);
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            const dateStr = dateObj.toDateString();
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            
            if (dateObj.getTime() > now.getTime()) {
                dayDiv.classList.add('future');
                dayDiv.innerHTML = `<span class="day-num">${i}</span>`;
            } else {
                const historyData = state.history && state.history[dateStr];

                dayDiv.innerHTML = `<span class="day-num">${i}</span>`;
                if (historyData && historyData.unrecorded) {
                    dayDiv.classList.add('unrecorded');
                    dayDiv.innerHTML += `<span class="day-points">Not tracked</span>`;

                    dayDiv.addEventListener('click', () => {
                        // App wasn't opened this day, so nothing was actually recorded
                        openDayDetailModal(dateStr, {
                            score: 0,
                            rank: state.currentRank || 'Novice',
                            tasks: JSON.parse(JSON.stringify(state.tasks)).map(t => ({...t, completed: false, pointsEarned: 0, completedAt: null})),
                            sideQuests: JSON.parse(JSON.stringify(state.sideQuests || [])).map(q => ({...q, completed: false, completedAt: null})),
                            date: dateStr,
                            unrecorded: true
                        });
                    });
                } else if (historyData) {
                    dayDiv.innerHTML += `<span class="day-points">${historyData.score} pts</span>`;

                    // Check if perfect day (all main quests completed)
                    const activeTasks = (historyData.tasks || []).filter(t => getRankValue(t.levelRequired || 'Novice') <= getRankValue(historyData.rank || 'Novice'));
                    if (activeTasks.length > 0 && activeTasks.every(t => t.completed)) {
                        dayDiv.classList.add('perfect-day');
                    }

                    dayDiv.addEventListener('click', () => {
                        openDayDetailModal(dateStr, historyData);
                    });
                } else {
                    dayDiv.addEventListener('click', () => {
                        // Empty data modal using current active tasks as uncompleted templates
                        openDayDetailModal(dateStr, {
                            score: 0,
                            rank: state.currentRank || 'Novice',
                            tasks: JSON.parse(JSON.stringify(state.tasks)).map(t => ({...t, completed: false, pointsEarned: 0, completedAt: null})),
                            sideQuests: JSON.parse(JSON.stringify(state.sideQuests || [])).map(q => ({...q, completed: false, completedAt: null})),
                            date: dateStr
                        });
                    });
                }
            }
            
            calendarGrid.appendChild(dayDiv);
        }
    }

    let currentDetailDate = null;
    
    function openDayDetailModal(dateStr, data) {
        closeCalendarModal();
        currentDetailDate = dateStr;
        dayDetailModal.classList.remove('hidden');
        
        dayDetailTitle.textContent = dateStr;
        
        // Set rank badge class dynamically
        dayDetailRank.textContent = data.rank || 'Novice';
        dayDetailRank.className = `badge-rank ${(data.rank || 'Novice').toLowerCase()}`;
        
        // Render Tasks
        dayDetailTasks.innerHTML = '';
        if (!data.tasks || data.tasks.length === 0) {
            dayDetailTasks.innerHTML = '<div class="empty-state">No tasks recorded for this day.</div>';
        } else {
            data.tasks.forEach(task => {
                const card = document.createElement('div');
                card.className = 'historical-task-card';
                card.innerHTML = `
                    <div class="historical-task-info">
                        <span class="historical-task-title">${task.title}</span>
                        <span class="task-meta">${task.completed ? task.pointsEarned : 0} / ${task.basePoints} pts</span>
                    </div>
                    <div class="historical-task-actions">
                        ${task.completed ? `<input type="time" class="historical-time-input" value="${task.completedAt || ''}" data-id="${task.id}" data-type="task">` : ''}
                        <input type="checkbox" class="historical-checkbox" data-id="${task.id}" data-type="task" ${task.completed ? 'checked' : ''}>
                    </div>
                `;
                dayDetailTasks.appendChild(card);
            });
        }
        
        // Render Quests
        dayDetailQuests.innerHTML = '';
        if (!data.sideQuests || data.sideQuests.length === 0) {
            dayDetailQuests.innerHTML = '<div class="empty-state">No side quests recorded for this day.</div>';
        } else {
            data.sideQuests.forEach(quest => {
                const card = document.createElement('div');
                card.className = 'historical-task-card';
                card.innerHTML = `
                    <div class="historical-task-info">
                        <span class="historical-task-title">${getCategoryIcon(quest.category)} ${quest.title}</span>
                        <span class="task-meta">+${quest.points} pts</span>
                    </div>
                    <div class="historical-task-actions">
                        ${quest.completed ? `<input type="time" class="historical-time-input" value="${quest.completedAt || ''}" data-id="${quest.id}" data-type="quest">` : ''}
                        <input type="checkbox" class="historical-checkbox" data-id="${quest.id}" data-type="quest" ${quest.completed ? 'checked' : ''}>
                    </div>
                `;
                dayDetailQuests.appendChild(card);
            });
        }
        
        // Add Event Listeners for editing
        document.querySelectorAll('.historical-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                toggleHistoricalTask(currentDetailDate, e.target.getAttribute('data-id'), e.target.getAttribute('data-type'), e.target.checked);
            });
        });
        
        document.querySelectorAll('.historical-time-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                updateHistoricalTime(currentDetailDate, e.target.getAttribute('data-id'), e.target.getAttribute('data-type'), e.target.value);
            });
        });
    }

    function closeDayDetailModal() {
        dayDetailModal.classList.add('hidden');
        currentDetailDate = null;
    }

    function toggleHistoricalTask(dateStr, id, type, isCompleted) {
        if (!state.history) state.history = {};
        
        // If they click on a day that previously had no history (or only an empty
        // "unrecorded" placeholder), generate a dummy history based on current templates
        const existing = state.history[dateStr];
        if (!existing || !Array.isArray(existing.tasks) || existing.tasks.length === 0) {
            state.history[dateStr] = {
                date: dateStr,
                score: 0,
                rank: (existing && existing.rank) || state.currentRank || 'Novice',
                tasks: JSON.parse(JSON.stringify(state.tasks)).map(t => ({...t, completed: false, pointsEarned: 0, completedAt: null})),
                sideQuests: JSON.parse(JSON.stringify(state.sideQuests || [])).map(q => ({...q, completed: false, completedAt: null}))
            };
        }

        const data = state.history[dateStr];
        delete data.unrecorded; // this day now has a real, edited record
        let oldScore = data.score || 0;
        let item = null;
        let pointsChange = 0;
        
        const now = new Date();
        const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (type === 'task') {
            item = data.tasks.find(t => t.id === id);
            if (item) {
                if (isCompleted) {
                    const taskTime = item.targetTime ? item.targetTime : `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
                    item.completed = true;
                    item.completedAt = taskTime;
                    item.pointsEarned = calculatePoints(item, taskTime);
                    pointsChange = item.pointsEarned;
                } else {
                    item.completed = false;
                    pointsChange = -(item.pointsEarned || 0);
                    item.pointsEarned = 0;
                    item.completedAt = null;
                }
            }
        } else if (type === 'quest') {
            item = data.sideQuests.find(q => q.id === id);
            if (item) {
                if (isCompleted) {
                    item.completed = true;
                    item.completedAt = defaultTime;
                    pointsChange = item.points || 0;
                } else {
                    item.completed = false;
                    pointsChange = -(item.points || 0);
                    item.completedAt = null;
                }
            }
        }
        
        data.score = Math.max(0, oldScore + pointsChange);

        // If editing a task changed whether every main quest was completed that day,
        // recompute the consecutive streak from history - editing a past day's tasks
        // previously never touched the streak/rank progress at all. A full recompute
        // (not a simple +1/-1) is needed because this is a true consecutive streak:
        // changing one day can cascade into every day after it.
        if (type === 'task' && dateStr !== new Date().toDateString()) {
            const dayRankVal = getRankValue(data.rank || 'Novice');
            const dayActiveTasks = data.tasks.filter(t => getRankValue(t.levelRequired || 'Novice') <= dayRankVal);
            data.allTasksCompleted = dayActiveTasks.length > 0 && dayActiveTasks.every(t => t.completed);

            const mostRecentClosedDay = new Date(state.lastResetDate);
            mostRecentClosedDay.setDate(mostRecentClosedDay.getDate() - 1);
            const newStreak = computeCurrentStreak(mostRecentClosedDay.toDateString());

            if (newStreak !== (state.completedDaysThisWeek || 0)) {
                state.completedDaysThisWeek = newStreak;
                if (newStreak >= 5) {
                    applyRankUpIfEligible();
                    state.completedDaysThisWeek = 0;
                    state.weeklyScore = 0;
                    state.cycleStartDate = new Date().toDateString();
                }
                updateRankProgressDisplay();
            }
        }

        // Adjust allTimeScore and update today's state if we are editing today
        state.allTimeScore = Math.max(0, (state.allTimeScore || 0) + pointsChange);

        if (dateStr === new Date().toDateString()) {
            if (type === 'task') {
                const liveItem = state.tasks.find(t => t.id === id);
                if (liveItem) {
                    liveItem.completed = item.completed;
                    liveItem.completedAt = item.completedAt;
                    liveItem.pointsEarned = item.pointsEarned;
                }
            } else if (type === 'quest') {
                const liveItem = state.sideQuests.find(q => q.id === id);
                if (liveItem) {
                    liveItem.completed = item.completed;
                    liveItem.completedAt = item.completedAt;
                }
            }
            recalculateTotalScore();
        }
        
        saveState();
        openDayDetailModal(dateStr, data); // Re-render detail
        
        // Render parent portal to update stats if calendar is open from there
        renderParentPortal();
        if (typeof updateScoreDisplays === 'function') updateScoreDisplays();
    }

    function updateHistoricalTime(dateStr, id, type, newTime) {
        if (!state.history || !state.history[dateStr] || type !== 'task') return;
        const data = state.history[dateStr];
        
        let oldScore = data.score || 0;
        let item = data.tasks.find(t => t.id === id);
        
        if (item && item.completed) {
            const oldPoints = item.pointsEarned || 0;
            item.completedAt = newTime;
            item.pointsEarned = calculatePoints(item, newTime);
            
            const pointsChange = item.pointsEarned - oldPoints;
            data.score = Math.max(0, oldScore + pointsChange);
            state.allTimeScore = Math.max(0, (state.allTimeScore || 0) + pointsChange);
            
            if (dateStr === new Date().toDateString()) {
                const liveItem = state.tasks.find(t => t.id === id);
                if (liveItem) {
                    liveItem.completedAt = item.completedAt;
                    liveItem.pointsEarned = item.pointsEarned;
                }
                recalculateTotalScore();
            }
            
            saveState();
            openDayDetailModal(dateStr, data); // Re-render
            
            renderParentPortal();
            if (typeof updateScoreDisplays === 'function') updateScoreDisplays();
        }
    }

    // --- Monthly Report Logic ---
    let currentReportDate = new Date();

    function openReportModal() {
        reportModal.classList.remove('hidden');
        renderReport();
    }

    function closeReportModalWindow() {
        reportModal.classList.add('hidden');
    }

    function changeReportMonth(direction) {
        currentReportDate.setMonth(currentReportDate.getMonth() + direction);
        renderReport();
    }

    const REPORT_STATUS_LABELS = {
        perfect: 'Perfect Day',
        partial: 'Partial',
        missed: 'Missed',
        'no-data': 'Not Tracked',
        future: '—'
    };

    // Build the day-by-day breakdown and totals for a given month from state.history.
    function getMonthlyReportData(dateObj) {
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = new Date().toDateString();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = [];
        let totalScore = 0;
        let totalTasksCompleted = 0;
        let perfectDays = 0;
        let daysWithData = 0;
        let daysElapsed = 0;
        let runningStreak = 0;
        let longestStreak = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const dayDate = new Date(year, month, d);
            dayDate.setHours(0, 0, 0, 0);
            const dateStr = dayDate.toDateString();
            const label = `${MONTH_NAMES[month].slice(0, 3)} ${d}`;

            if (dayDate.getTime() > today.getTime()) {
                days.push({ day: d, label, dateStr, status: 'future', score: 0, completedCount: 0, totalCount: 0 });
                continue;
            }
            daysElapsed++;

            let entry = state.history && state.history[dateStr];
            if (dateStr === todayStr && (!entry || entry.unrecorded)) {
                // Today may not be archived to history yet - use live progress so far
                const rankVal = getRankValue(state.currentRank || 'Novice');
                entry = {
                    score: state.score || 0,
                    tasks: state.tasks.filter(t => getRankValue(t.levelRequired || 'Novice') <= rankVal),
                    rank: state.currentRank
                };
            }

            let status, score, completedCount, totalCount;
            if (entry && !entry.unrecorded && Array.isArray(entry.tasks) && entry.tasks.length > 0) {
                const rankVal = getRankValue(entry.rank || 'Novice');
                const activeTasks = entry.tasks.filter(t => getRankValue(t.levelRequired || 'Novice') <= rankVal);
                completedCount = activeTasks.filter(t => t.completed).length;
                totalCount = activeTasks.length;
                score = entry.score || 0;
                status = (totalCount > 0 && completedCount === totalCount) ? 'perfect' : (completedCount > 0 ? 'partial' : 'missed');
                daysWithData++;
            } else {
                status = 'no-data';
                score = 0;
                completedCount = 0;
                totalCount = 0;
            }

            totalScore += score;
            totalTasksCompleted += completedCount;
            if (status === 'perfect') {
                perfectDays++;
                runningStreak++;
                longestStreak = Math.max(longestStreak, runningStreak);
            } else {
                runningStreak = 0;
            }

            days.push({ day: d, label, dateStr, status, score, completedCount, totalCount });
        }

        const consistencyPercent = daysElapsed > 0 ? Math.round((perfectDays / daysElapsed) * 100) : 0;

        return { year, month, days, totalScore, totalTasksCompleted, perfectDays, daysWithData, daysElapsed, longestStreak, consistencyPercent };
    }

    const REPORT_CHART_COLORS = {
        perfect: '#10b981',
        partial: '#f59e0b',
        missed: '#ef4444',
        'no-data': '#cbd5e1',
        future: '#f1f5f9'
    };

    // Draws a white-background bar chart (so it looks the same in-app and in the
    // exported PDF) of each day's score, color-coded by completion status.
    function drawScoreChart(canvas, days) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        const padding = { top: 16, right: 12, bottom: 26, left: 12 };
        const chartW = W - padding.left - padding.right;
        const chartH = H - padding.top - padding.bottom;
        const maxScore = Math.max(10, ...days.map(d => d.score || 0));
        const barGap = 4;
        const barWidth = chartW / days.length - barGap;

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const gy = padding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, gy);
            ctx.lineTo(W - padding.right, gy);
            ctx.stroke();
        }

        days.forEach((d, i) => {
            const x = padding.left + i * (barWidth + barGap);
            const barH = d.status === 'future' ? 0 : Math.max((d.score / maxScore) * chartH, d.score > 0 ? 2 : 0);
            const y = padding.top + chartH - barH;
            ctx.fillStyle = REPORT_CHART_COLORS[d.status] || '#cbd5e1';
            ctx.fillRect(x, y, barWidth, barH);

            ctx.fillStyle = '#64748b';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(String(d.day), x + barWidth / 2, H - 8);
        });
    }

    function renderReport() {
        reportMonthYear.textContent = `${MONTH_NAMES[currentReportDate.getMonth()]} ${currentReportDate.getFullYear()}`;
        const data = getMonthlyReportData(currentReportDate);

        const stats = [
            [data.totalTasksCompleted, 'Tasks Completed'],
            [data.totalScore, 'Score Earned'],
            [data.perfectDays, 'Perfect Days'],
            [`${data.longestStreak} day${data.longestStreak === 1 ? '' : 's'}`, 'Longest Streak'],
            [`${data.consistencyPercent}%`, 'Consistency'],
            [`${data.daysWithData}/${data.daysElapsed}`, 'Days Tracked']
        ];
        reportSummaryGrid.innerHTML = stats.map(([value, label]) => `
            <div class="report-stat-card">
                <span class="report-stat-value">${value}</span>
                <span class="report-stat-label">${label}</span>
            </div>
        `).join('');

        drawScoreChart(reportChartCanvas, data.days);

        reportTableBody.innerHTML = data.days
            .filter(d => d.status !== 'future')
            .map(d => `
                <tr>
                    <td>${d.label}</td>
                    <td>${d.totalCount > 0 ? `${d.completedCount}/${d.totalCount}` : '—'}</td>
                    <td>${d.score}</td>
                    <td><span class="report-status ${d.status}">${REPORT_STATUS_LABELS[d.status]}</span></td>
                </tr>
            `).join('');
    }

    function downloadReportPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('The PDF library failed to load. Check your internet connection and try again.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        const data = getMonthlyReportData(currentReportDate);
        const monthLabel = `${MONTH_NAMES[currentReportDate.getMonth()]} ${currentReportDate.getFullYear()}`;
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 40;
        let y = 50;

        doc.setFont(undefined, 'bold');
        doc.setFontSize(18);
        doc.text('PowerFlow Monthly Report', marginX, y);
        y += 20;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        doc.setTextColor(90);
        doc.text(`${monthLabel}  •  Generated ${new Date().toLocaleDateString()}`, marginX, y);
        doc.setTextColor(0);
        y += 30;

        const stats = [
            [data.totalTasksCompleted, 'Tasks Completed'],
            [data.totalScore, 'Score Earned'],
            [data.perfectDays, 'Perfect Days'],
            [`${data.longestStreak} day${data.longestStreak === 1 ? '' : 's'}`, 'Longest Streak'],
            [`${data.consistencyPercent}%`, 'Consistency'],
            [`${data.daysWithData}/${data.daysElapsed}`, 'Days Tracked']
        ];
        const colWidth = (pageWidth - marginX * 2) / 3;
        stats.forEach((pair, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = marginX + col * colWidth;
            const py = y + row * 36;
            doc.setFont(undefined, 'bold');
            doc.setFontSize(15);
            doc.text(String(pair[0]), x, py);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(pair[1].toUpperCase(), x, py + 13);
            doc.setTextColor(0);
        });
        y += 36 * 2 + 15;

        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Daily Score', marginX, y);
        y += 8;
        const chartWidth = pageWidth - marginX * 2;
        const chartHeight = chartWidth * (reportChartCanvas.height / reportChartCanvas.width);
        doc.addImage(reportChartCanvas.toDataURL('image/png'), 'PNG', marginX, y, chartWidth, chartHeight);
        y += chartHeight + 20;

        doc.autoTable({
            startY: y,
            head: [['Date', 'Tasks', 'Score', 'Status']],
            body: data.days.filter(d => d.status !== 'future').map(d => [
                d.label,
                d.totalCount > 0 ? `${d.completedCount}/${d.totalCount}` : '—',
                d.score,
                REPORT_STATUS_LABELS[d.status]
            ]),
            theme: 'striped',
            headStyles: { fillColor: [67, 56, 202] },
            margin: { left: marginX, right: marginX },
            styles: { fontSize: 9 }
        });

        doc.save(`PowerFlow_Report_${monthLabel.replace(' ', '_')}.pdf`);
    }

    // Run Initialization
    init();
});

