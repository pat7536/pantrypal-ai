/**
 * planner.js
 * Weekly Meal Planner logic for PantryPal AI
 * Handles date calculations and meal plan management
 */

// Week offset from current week (0 = current, 1 = next week, -1 = previous week)
let weekOffset = 0;

/**
 * Get the Monday of the current week
 * @param {number} offset - Week offset (0 = current, 1 = next, -1 = previous)
 * @returns {Date} - Monday of the week
 */
function getCurrentWeekStart(offset = 0) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (offset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Get week ID string from a date (YYYY-MM-DD format of Monday)
 * @param {Date} date - Any date in the week
 * @returns {string} - Week ID in YYYY-MM-DD format
 */
function getWeekIdFromDate(date) {
    const monday = getCurrentWeekStart(weekOffset);
    return formatDateToString(monday);
}

/**
 * Set the week offset
 * @param {number} offset - Week offset value
 */
function setWeekOffset(offset) {
    weekOffset = offset;
}

/**
 * Get the current week offset
 * @returns {number} - Current week offset
 */
function getWeekOffset() {
    return weekOffset;
}

/**
 * Navigate to the next week
 */
function goToNextWeek() {
    weekOffset++;
}

/**
 * Navigate to the previous week
 */
function goToPreviousWeek() {
    weekOffset--;
}

/**
 * Reset to current week
 */
function resetToCurrentWeek() {
    weekOffset = 0;
}

/**
 * Format date to YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
function formatDateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get all dates for the current week (Monday to Sunday)
 * @returns {Array<Object>} - Array of date objects with info
 */
function getCurrentWeekDates() {
    const monday = getCurrentWeekStart(weekOffset);
    const weekDates = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push({
            date: date,
            dateString: formatDateToString(date),
            dayName: dayNames[i],
            dayShort: dayNames[i].substring(0, 3),
            dayNumber: date.getDate(),
            month: date.toLocaleString('default', { month: 'short' })
        });
    }

    return weekDates;
}

/**
 * Initialize an empty planner structure for the week
 * @returns {Object} - Empty planner data structure
 */
function initializePlannerForWeek() {
    const weekStart = getCurrentWeekStart(weekOffset);
    const weekDates = getCurrentWeekDates();

    const meals = {};
    weekDates.forEach(day => {
        meals[day.dateString] = {
            dinner: null
        };
    });

    return {
        weekStart: formatDateToString(weekStart),
        meals: meals,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Set a meal for a specific day
 * @param {Object} plannerData - Current planner data
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} recipeId - Recipe ID to assign
 * @returns {Object} - Updated planner data
 */
function setMeal(plannerData, dateString, recipeId) {
    if (!plannerData.meals[dateString]) {
        plannerData.meals[dateString] = {};
    }
    plannerData.meals[dateString].dinner = recipeId;
    plannerData.updatedAt = new Date().toISOString();
    return plannerData;
}

/**
 * Remove a meal from a specific day
 * @param {Object} plannerData - Current planner data
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Object} - Updated planner data
 */
function removeMeal(plannerData, dateString) {
    if (plannerData.meals[dateString]) {
        plannerData.meals[dateString].dinner = null;
    }
    plannerData.updatedAt = new Date().toISOString();
    return plannerData;
}

/**
 * Get all recipe IDs from the planner
 * @param {Object} plannerData - Planner data
 * @returns {Array<string>} - Array of recipe IDs (no duplicates)
 */
function getPlannedRecipeIds(plannerData) {
    const recipeIds = new Set();

    Object.values(plannerData.meals).forEach(dayMeals => {
        if (dayMeals.dinner) {
            recipeIds.add(dayMeals.dinner);
        }
    });

    return Array.from(recipeIds);
}

/**
 * Check if planner has any meals planned
 * @param {Object} plannerData - Planner data
 * @returns {boolean} - True if at least one meal is planned
 */
function hasMealsPlanned(plannerData) {
    return getPlannedRecipeIds(plannerData).length > 0;
}

/**
 * Get formatted week range string
 * @returns {string} - e.g., "Nov 18 - Nov 24, 2024"
 */
function getWeekRangeString() {
    const weekDates = getCurrentWeekDates();
    const monday = weekDates[0];
    const sunday = weekDates[6];

    const options = { month: 'short', day: 'numeric' };
    const mondayStr = monday.date.toLocaleDateString('en-US', options);
    const sundayStr = sunday.date.toLocaleDateString('en-US', options);
    const year = sunday.date.getFullYear();

    // Add indicator if viewing past/future week
    let label = `${mondayStr} - ${sundayStr}, ${year}`;
    if (weekOffset === 0) {
        label += ' (This Week)';
    } else if (weekOffset === 1) {
        label += ' (Next Week)';
    } else if (weekOffset === -1) {
        label += ' (Last Week)';
    }

    return label;
}

/**
 * Clear all meals from the planner
 * @param {Object} plannerData - Current planner data
 * @returns {Object} - Updated planner data with all meals cleared
 */
function clearPlannerMeals(plannerData) {
    Object.keys(plannerData.meals).forEach(dateString => {
        plannerData.meals[dateString].dinner = null;
    });
    plannerData.updatedAt = new Date().toISOString();
    return plannerData;
}
