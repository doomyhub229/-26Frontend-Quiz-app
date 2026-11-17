
"use strict";

// DOM ELEMENTS

const themeButton = document.querySelector(".theme-switcher button");
const startScreen = document.querySelector(".start-screen");
const questionScreen = document.querySelector(".question-screen");
const resultsScreen = document.querySelector(".results-screen");

const subjectButtons = document.querySelectorAll(".subjects .btn");
const answerButtons = document.querySelectorAll(".answer-btn");

const submitButton = document.querySelector(".submit-btn");
const playAgainButton = document.querySelector(".play-again-btn");

const questionTitle = document.querySelector(".question-title");
const questionInfo = document.querySelector(".question-info");
const progressFill = document.querySelector(".progress-fill");
const answerTexts = document.querySelectorAll(".answer-btn code");

const finalScore = document.querySelector(".final-score");
const totalQuestions = document.querySelector(".total-questions");
const resultTitle = document.querySelector(".result-title");
const resultIcon = document.querySelector(".result-icon");
const answerError = document.querySelector(".answer-error");

const welcomeTitle = document.querySelector(".welcome h1");
const resultsHeading = document.querySelector(".results-heading h1");

// QUIZ STATE

let quizzes = [];
let selectedQuiz = null;
let currentQuestionIndex = 0;
let selectedAnswer = null;
let isAnswered = false;
let score = 0;

// DARK / LIGHT MODE

function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);

    themeButton.setAttribute(
        "aria-pressed",
        String(isDark)
    );
}

// Restore saved theme

let savedTheme = null;

try {
    savedTheme = localStorage.getItem("theme");
} catch (error) {
    console.warn("Theme storage unavailable:", error);
}

applyTheme(savedTheme === "dark");

// Toggle and save theme

themeButton.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");

    applyTheme(isDark);

    try {
        localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (error) {
        console.warn("Could not save theme:", error);
    }
});

// LOAD QUIZ DATA

async function loadQuiz() {
    try {
        const response = await fetch("./data.json");

        if (!response.ok) {
            throw new Error("Failed to load quiz data");
        }

        const data = await response.json();

        if (!Array.isArray(data.quizzes)) {
            throw new Error("Invalid quiz data");
        }

        quizzes = data.quizzes;

        // Enable category buttons

        subjectButtons.forEach((button, index) => {
            if (!quizzes[index]) {
                button.disabled = true;
                return;
            }

            button.addEventListener("click", () => {
                startQuiz(quizzes[index]);
            });
        });

    } catch (error) {
        console.error("Error loading quiz:", error);

        subjectButtons.forEach((button) => {
            button.disabled = true;
        });
    }
}

// START QUIZ

function startQuiz(quiz) {
    if (!quiz || !quiz.questions?.length) {
        return;
    }

    selectedQuiz = quiz;
    currentQuestionIndex = 0;
    selectedAnswer = null;
    isAnswered = false;
    score = 0;

    startScreen.hidden = true;
    resultsScreen.hidden = true;
    questionScreen.hidden = false;

    submitButton.disabled = false;

    showQuestion();

    // Move keyboard focus to question
    questionTitle.focus();
}

// DISPLAY QUESTION

function showQuestion() {
    const currentQuestion =
        selectedQuiz.questions[currentQuestionIndex];

    // Reset state

    selectedAnswer = null;
    isAnswered = false;
    answerError.hidden = true;

    // Reset answer buttons

    answerButtons.forEach((button) => {
        button.disabled = false;
        button.setAttribute("aria-pressed", "false");

        button.classList.remove(
            "selected",
            "correct",
            "incorrect"
        );

        const icon = button.querySelector(".answer-icon");

        if (icon) {
            icon.hidden = true;
            icon.removeAttribute("src");
        }
    });

    // Question title

    questionTitle.textContent = currentQuestion.question;

    // Question number

    questionInfo.textContent =
        `Question ${currentQuestionIndex + 1} of ${selectedQuiz.questions.length}`;

    // Answer options

    answerTexts.forEach((element, index) => {
        element.textContent = currentQuestion.options[index] ?? "";
    });

    // Progress bar

    const progress =
        ((currentQuestionIndex + 1) /
            selectedQuiz.questions.length) * 100;

    progressFill.style.width = `${progress}%`;
    document.querySelector(".progress-bar")
    .setAttribute("aria-valuenow", String(progress));

    // Reset submit button

    submitButton.textContent = "Submit Answer";
}

// SELECT ANSWER

answerButtons.forEach((button) => {
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => {
        if (!selectedQuiz || isAnswered || button.disabled) {
            return;
        }

        const answerText =
            button.querySelector("code").textContent;

        // Remove previous selection

        answerButtons.forEach((answer) => {
            answer.classList.remove("selected");
            answer.setAttribute("aria-pressed", "false");
        });

        // Select clicked answer

        button.classList.add("selected");
        button.setAttribute("aria-pressed", "true");

        selectedAnswer = answerText;

        // Hide previous error

        answerError.hidden = true;
    });
});

// SHOW ANSWER ICON

function showAnswerIcon(button, type) {
    const icon = button.querySelector(".answer-icon");

    if (!icon) {
        return;
    }

    icon.src = `./assets/images/icon-${type}.svg`;
    icon.alt = "";
    icon.hidden = false;
}

// CHECK ANSWER

function checkAnswer() {
    if (selectedAnswer === null) {
        answerError.hidden = false;
        return;
    }

    answerError.hidden = true;

    const currentQuestion =
        selectedQuiz.questions[currentQuestionIndex];

    const correctAnswer = currentQuestion.answer;

    const selectedButton =
        document.querySelector(".answer-btn.selected");

    if (!selectedButton) {
        return;
    }

    // Correct answer

    if (selectedAnswer === correctAnswer) {
        selectedButton.classList.add("correct");
        showAnswerIcon(selectedButton, "correct");

        score++;
    } else {
        // Incorrect answer

        selectedButton.classList.add("incorrect");
        showAnswerIcon(selectedButton, "incorrect");

        // Highlight correct answer

        const correctButton = [...answerButtons].find((button) => {
            return button.querySelector("code").textContent === correctAnswer;
        });

        if (correctButton) {
            correctButton.classList.add("correct");
            showAnswerIcon(correctButton, "correct");
        }
    }

    // Lock answer

    isAnswered = true;

    answerButtons.forEach((button) => {
        button.disabled = true;
    });

    // Change button text

    submitButton.textContent = "Next Question";
}

// SHOW RESULTS

function showResults() {
    questionScreen.hidden = true;
    resultsScreen.hidden = false;

    finalScore.textContent = score;

    totalQuestions.textContent =
        `out of ${selectedQuiz.questions.length}`;

    resultTitle.textContent = selectedQuiz.title;
    resultIcon.src = selectedQuiz.icon;
    resultIcon.alt = "";

    // Move focus to results heading

    resultsHeading.focus();
}

// SUBMIT ANSWER / NEXT QUESTION

submitButton.addEventListener("click", () => {
    if (!selectedQuiz) {
        return;
    }

    // Move to next question

    if (isAnswered) {
        currentQuestionIndex++;

        if (currentQuestionIndex >= selectedQuiz.questions.length) {
            showResults();
            return;
        }

        showQuestion();
        questionTitle.focus();
        return;
    }

    // Check current answer

    checkAnswer();
});

// PLAY AGAIN

playAgainButton.addEventListener("click", () => {
    // Hide results

    resultsScreen.hidden = true;
    questionScreen.hidden = true;

    // Show start screen

    startScreen.hidden = false;

    // Reset quiz state

    selectedQuiz = null;
    currentQuestionIndex = 0;
    selectedAnswer = null;
    isAnswered = false;
    score = 0;

    answerError.hidden = true;

    submitButton.disabled = false;
    submitButton.textContent = "Submit Answer";

    // Move focus to welcome heading

    welcomeTitle.focus();
});

// START APPLICATION

loadQuiz();
