let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 20;
let selectedCategory = "";

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("login-screen").style.display = "block";
    document.getElementById("category-menu").style.display = "none";
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("end-menu").style.display = "none";
});

function loadQuestion() {
    // Clear any existing timer and reset
    clearInterval(timer);
    timeLeft = 20;
    document.getElementById("timer").textContent = `Time Left: ${timeLeft}s`;
    timer = setInterval(updateTimer, 1000);

    // Reset explanation and options
    document.getElementById("explanation").textContent = "";
    document.getElementById("explanation").style.display = "none";
      
    // Load current question    
    let questionData = questions[selectedCategory][currentQuestionIndex];
    document.getElementById("question").textContent = questionData.question;
    let optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    if (questionData.type === "select") {
        // MCQ type question
        questionData.options.forEach(option => {
            let div = document.createElement("div");
            div.textContent = option;
            div.classList.add("option");
            div.onclick = () => checkAnswer(option, questionData.answer, questionData.explanation);
            optionsContainer.appendChild(div);
        });
    } else if (questionData.type === "reorder") {
        // Reorder type question
        // Get the original options array
        const originalOptions = questionData.options;

        // Create a copy of the array to avoid modifying the original
        const optionsCopy = Array.from(originalOptions);

        // Shuffle the copied array using Fisher-Yates algorithm
        // (the current method using Math.random() - 0.5 is a simple but less ideal shuffle)
        const shuffledOptions = optionsCopy.sort(() => Math.random() - 0.5);

        let reorderList = document.createElement("div");
        reorderList.className = "reorder-list";

        shuffledOptions.forEach((option, index) => {
            let item = document.createElement("div");
            item.className = "reorder-item";
            item.textContent = option;
            item.draggable = true;
            item.id = `item-${index}`;

            item.addEventListener("dragstart", dragStart);
            item.addEventListener("dragover", dragOver);
            item.addEventListener("drop", drop);
            item.addEventListener("dragenter", dragEnter);
            item.addEventListener("dragleave", dragLeave);

            reorderList.appendChild(item);
        });

        optionsContainer.appendChild(reorderList);

        let submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit Answer";
        submitBtn.className = "submit-btn";
        submitBtn.onclick = () => checkReorderAnswer(questionData.answer, questionData.explanation);
        optionsContainer.appendChild(submitBtn);
    }
}

function checkAnswer(selected, correct, explanation) {
    clearInterval(timer);
    let options = document.querySelectorAll(".option");

    options.forEach(option => {
        if (option.textContent === correct) {
            option.classList.add("correct");
        }
        if (option.textContent === selected && selected !== correct) {
            option.classList.add("wrong");
        }
        option.onclick = null;
    });

    if (selected === correct) {
        score++;
    }

    document.getElementById("explanation").textContent = explanation;
    document.getElementById("explanation").style.display = "block";

    // setTimeout(nextQuestion, 3000);
}

function checkReorderAnswer(correctOrder, explanation) {
    clearInterval(timer);

    const items = document.querySelectorAll(".reorder-item");
    const userOrder = Array.from(items).map(item => item.textContent);

    const isCorrect = userOrder.every((item, index) => item === correctOrder[index]);

    if (isCorrect) {
        score++;
    }

    const reorderList = document.querySelector(".reorder-list");
    reorderList.innerHTML = "";

    correctOrder.forEach(item => {
        let div = document.createElement("div");
        div.textContent = item;
        div.className = "reorder-item correct-order";
        reorderList.appendChild(div);
    });

    document.querySelector(".submit-btn").disabled = true;
    document.getElementById("explanation").textContent = explanation;
    document.getElementById("explanation").style.display = "block";

    // setTimeout(nextQuestion, 3000);
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        document.getElementById("timer").textContent = `Time Left: ${timeLeft}s`;
    } else {
        clearInterval(timer);
        showCorrectAnswer();
        // nextQuestion();
    }
}

function showCorrectAnswer() {
    let questionData = questions[selectedCategory][currentQuestionIndex];
    
    if (questionData.type === "select") {
        let options = document.getElementsByClassName("option");
        for (let i = 0; i < options.length; i++) {
            if (options[i].textContent === questionData.answer) {
                options[i].classList.add("correct");
            }
            options[i].onclick = null; // Disable clicking other answers
        }
    } else if (questionData.type === "reorder") {
        // Display the correct order for reorder questions
        const reorderList = document.querySelector(".reorder-list");
        if (reorderList) {
            reorderList.innerHTML = "";
            
            questionData.answer.forEach((item) => {
                let div = document.createElement("div");
                div.textContent = item;
                div.className = "reorder-item correct-order";
                reorderList.appendChild(div);
            });
            
            // Disable submit button
            const submitBtn = document.querySelector(".submit-btn");
            if (submitBtn) submitBtn.disabled = true;
        }
    }

    document.getElementById("explanation").textContent = questionData.explanation;
    document.getElementById("explanation").style.display = "block";
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions[selectedCategory].length) {
        loadQuestion();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("end-menu").style.display = "block";
    document.getElementById("final-score").textContent = `Score: ${score}`;
}

function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
    setTimeout(() => e.target.classList.add("dragging"), 0);
}

function dragEnter(e) {
    e.preventDefault();
    e.target.classList.add("drag-over");
}

function dragLeave(e) {
    e.target.classList.remove("drag-over");
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const draggable = document.getElementById(id);
    let dropTarget = e.target.closest(".reorder-item");

    if (dropTarget && dropTarget !== draggable) {
        const container = dropTarget.parentElement;
        const afterElement = getDropPosition(container, e.clientY);

        if (afterElement) {
            container.insertBefore(draggable, afterElement);
        } else {
            container.appendChild(draggable);
        }
    }

    document.querySelectorAll(".reorder-item").forEach(item => item.classList.remove("drag-over"));
    draggable.classList.remove("dragging");
}

function getDropPosition(container, y) {
    // Get all reorder items except the one being dragged
    const items = container.querySelectorAll(".reorder-item:not(.dragging)");
    
    // Convert NodeList to Array
    const itemsArray = Array.from(items);
    
    // Initial value for reduce
    const initialValue = { 
        offset: Number.NEGATIVE_INFINITY,
        element: null
    };
    
    // Find the closest element using reduce
    const result = itemsArray.reduce((closest, child) => {
        // Calculate the position of this element
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        // Check if this element is a better match than our previous closest
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, initialValue);
    
    // Return just the element property from our result
    return result.element;
}

function checkAnswer(selected, correct, explanation) {
    clearInterval(timer); // Stop the timer
    
    let options = document.getElementsByClassName("option");
    for (let i = 0; i < options.length; i++) {
        if (options[i].textContent === correct) {
            options[i].classList.add("correct");
        }
        if (options[i].textContent === selected && selected !== correct) {
            options[i].classList.add("wrong");
        }
        options[i].onclick = null; // Disable clicking other answers
    }
    
    if (selected === correct) {
        score++;
    }

    document.getElementById("explanation").textContent = explanation;
    document.getElementById("explanation").style.display = "block";
}

function checkReorderAnswer(correctOrder, explanation) {
    clearInterval(timer);
    
    const items = document.querySelectorAll(".reorder-item");
    const userOrder = Array.from(items).map(item => item.textContent);
    
    const isCorrect = userOrder.every((item, index) => item === correctOrder[index]);
    
    if (isCorrect) {
        score++;
    }
    
    const reorderList = document.querySelector(".reorder-list");
    reorderList.innerHTML = "";
    
    correctOrder.forEach((item) => {
        let div = document.createElement("div");
        div.textContent = item;
        div.className = "reorder-item correct-order";
        reorderList.appendChild(div);
    });
    
    // Disable submit button
    const submitBtn = document.querySelector(".submit-btn");
    if (submitBtn) submitBtn.disabled = true;
    
    document.getElementById("explanation").textContent = explanation;
    document.getElementById("explanation").style.display = "block";
}

const questions = {
    forLoops: [
        { 
            question: "Which of the following code blocks correctly prints numbers from 1 to 5?", 
            options: [
                "for i in range(1, 5):\n    print(i)",
                "for i in range(1, 6):\n    print(i)"
            ], 
            answer: "for i in range(1, 6):\n    print(i)", 
            explanation: "The range(1, 6) correctly generates numbers 1 through 5, while range(1, 5) only generates 1 through 4.",
            type: "select"
        },
        { 
            question: "Which of the following code blocks correctly calculates the sum of even numbers from 2 to 10?", 
            options: [
                "sum = 0\nfor num in range(2, 11, 2):\n    sum += num\nprint(sum)",
                "sum = 0\nfor num in range(2, 10, 2):\n    sum += num\nprint(sum)"
            ], 
            answer: "sum = 0\nfor num in range(2, 11, 2):\n    sum += num\nprint(sum)", 
            explanation: "The range(2, 11, 2) correctly includes all even numbers from 2 to 10, while range(2, 10, 2) would miss the number 10.",
            type: "select"
        },
        { 
            question: "Which of the following code blocks correctly prints all elements of a list except the first one?", 
            options: [
                "my_list = [10, 20, 30, 40, 50]\nfor i in range(1, len(my_list)):\n    print(my_list[i])",
                "my_list = [10, 20, 30, 40, 50]\nfor element in my_list[1:]:\n    print(element)"
            ], 
            answer: "my_list = [10, 20, 30, 40, 50]\nfor element in my_list[1:]:\n    print(element)", 
            explanation: "Both approaches are correct, but using slice notation (my_list[1:]) is more Pythonic.",
            type: "select"
        },
        {
            question: "Arrange the following lines to create a program that finds the largest number in a list:",
            options: [
                "for num in numbers:",
                "numbers = [23, 45, 9, 78, 34]",
                "largest = numbers[0]",
                "print(\"The largest number is:\", largest)",
                "if num > largest:",
                "largest = num"
            ],
            answer: ["numbers = [23, 45, 9, 78, 34]", "largest = numbers[0]", "for num in numbers:", "if num > largest:", "largest = num", "print(\"The largest number is:\", largest)"],
            explanation: "First define the list, then initialize largest with the first element, loop through each number, compare it with largest, update if necessary, finally print the result.",
            type: "reorder"
        }
    ],
    whileLoops: [
        { 
            question: "Which of the following code blocks correctly creates a loop that exits when the user enters 'quit'?", 
            options: [
                "user_input = ''\nwhile user_input != 'quit':\n    user_input = input(\"Enter command (type 'quit' to exit): \")",
                "user_input = ''\nwhile True:\n    user_input = input(\"Enter command (type 'quit' to exit): \")\n    if user_input == 'quit':\n        break"
            ], 
            answer: "user_input = ''\nwhile user_input != 'quit':\n    user_input = input(\"Enter command (type 'quit' to exit): \")", 
            explanation: "Both approaches are correct, but the first one is more straightforward for this specific task.",
            type: "select"
        },
        {
            question: "Arrange the following lines to create a function that returns the factorial of a number using a while loop:",
            options: [
                "def factorial(n):",
                "result = 1",
                "while n > 0:",
                "return result",
                "result *= n",
                "n -= 1"
            ],
            answer: ["def factorial(n):", "result = 1", "while n > 0:", "result *= n", "n -= 1", "return result"],
            explanation: "First define the function, initialize result to 1, create while loop that continues until n is zero, multiply result by n, decrement n, and finally return the result.",
            type: "reorder"
        },
        {
            question: "Given the following code, what will it print? Select the option that correctly explains its behavior:\n\nx = 5\nwhile x > 0:\n    print(x)\n    x -= 1\nelse:\n    print(\"Loop completed\")",
            options: [
                "The code prints numbers 5 to 1, and \"Loop completed\" only runs if the loop completes normally",
                "The code prints numbers 5 to 1, and \"Loop completed\" runs after any break statement",
                "The code prints numbers 5 to 0, and \"Loop completed\" afterwards",
                "The code prints numbers 5 to 1, but \"Loop completed\" never runs"
            ],
            answer: "The code prints numbers 5 to 1, and \"Loop completed\" only runs if the loop completes normally",
            explanation: "The loop prints 5, 4, 3, 2, 1, and \"Loop completed\". The else block executes when the loop condition becomes False.",
            type: "select"
        },
        {
            question: "Arrange the following lines to create a program that finds all numbers divisible by both 3 and 5 in the range 1 to 50:",
            options: [
                "for num in range(1, 51):",
                "print(\"Numbers divisible by both 3 and 5:\", result)",
                "result = []",
                "if num % 3 == 0 and num % 5 == 0:",
                "result.append(num)"
            ],
            answer: ["result = []", "for num in range(1, 51):", "if num % 3 == 0 and num % 5 == 0:", "result.append(num)", "print(\"Numbers divisible by both 3 and 5:\", result)"],
            explanation: "First initialize an empty list, create a loop through numbers 1-50, check if divisible by both 3 and 5, add to result list if true, finally print the result.",
            type: "reorder"
        }
    ],
    ifElseStatements: [
        { 
            question: "Which of the following code blocks correctly prints \"Valid score\" if the score is between 0 and 100 inclusive?", 
            options: [
                "score = 75\nif score > 0 and score < 100:\n    print(\"Valid score\")",
                "score = 75\nif score >= 0 and score <= 100:\n    print(\"Valid score\")"
            ], 
            answer: "score = 75\nif score >= 0 and score <= 100:\n    print(\"Valid score\")", 
            explanation: "The condition score >= 0 and score <= 100 correctly includes boundary values 0 and 100, while the first option excludes them.",
            type: "select"
        },
        {
            question: "Arrange the following lines to create a program that takes a list of temperatures in Celsius and converts them to Fahrenheit:",
            options: [
                "def celsius_to_fahrenheit(celsius):",
                "return (celsius * 9/5) + 32",
                "celsius_temps = [0, 10, 25, 30, 40]",
                "fahrenheit_temps = []",
                "for temp in celsius_temps:",
                "fahrenheit_temps.append(celsius_to_fahrenheit(temp))",
                "print(\"Fahrenheit temperatures:\", fahrenheit_temps)"
            ],
            answer: ["def celsius_to_fahrenheit(celsius):", "return (celsius * 9/5) + 32", "celsius_temps = [0, 10, 25, 30, 40]", "fahrenheit_temps = []", "for temp in celsius_temps:", "fahrenheit_temps.append(celsius_to_fahrenheit(temp))", "print(\"Fahrenheit temperatures:\", fahrenheit_temps)"],
            explanation: "First define the conversion function, define the input temperatures, create an empty list for the results, loop through each celsius temperature, convert and append to the fahrenheit list, finally print the results.",
            type: "reorder"
        },
        {
            question: "Arrange the following lines to create a program that determines whether numbers are even or odd:",
            options: [
                "count = 0",
                "while count < 5:",
                "if count % 2 == 0:",
                "print(f\"{count} is even\")",
                "else:",
                "print(f\"{count} is odd\")",
                "count += 1"
            ],
            answer: ["count = 0", "while count < 5:", "if count % 2 == 0:", "print(f\"{count} is even\")", "else:", "print(f\"{count} is odd\")", "count += 1"],
            explanation: "Initialize counter, create while loop, check if number is even, print appropriate message based on condition, increment counter. Output: 0 is even, 1 is odd, 2 is even, 3 is odd, 4 is even",
            type: "reorder"
        },
        {
            question: "Arrange the following lines to create a program that prints the first n Fibonacci numbers:",
            options: [
                "n = 6  # Number of Fibonacci numbers to generate",
                "a, b = 0, 1",
                "for i in range(n):",
                "print(a, end=\" \")",
                "a, b = b, a + b"
            ],
            answer: ["n = 6  # Number of Fibonacci numbers to generate", "a, b = 0, 1", "for i in range(n):", "print(a, end=\" \")", "a, b = b, a + b"],
            explanation: "Define how many Fibonacci numbers to generate, initialize first two values, loop n times, print current value, update variables for next iteration.",
            type: "reorder"
        }
    ]
};


function showCategoryMenu() {
    // Hide any other screens than the cetagory menu
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("category-menu").style.display = "block";
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("end-menu").style.display = "none";
}

function selectCategory(category) {
    selectedCategory = category;
    currentQuestionIndex = 0;
    score = 0;

    document.getElementById("category-menu").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";
    document.getElementById("end-menu").style.display = "none"; 
    document.getElementById("score-display").style.display = "none"; 
    loadQuestion();
}

function returnToCategories() {
    clearInterval(timer); // Clear any existing timer

    // Hide other screens and show category menu container
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("end-menu").style.display = "none";
    document.getElementById("category-menu").style.display = "block";
    
    // Reset variables
    currentQuestionIndex = 0;
    score = 0;
    selectedCategory = "";
    
    // Clear any existing content
    document.getElementById("explanation").textContent = "";
    document.getElementById("explanation").style.display = "none";
    document.getElementById("options").innerHTML = "";
}



function startQuiz(category) {
    
    // Hide other screens and show quiz container
    document.getElementById("category-menu").style.display = "none";
    document.getElementById("end-menu").style.display = "none";
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";

    selectedCategory = category;
    currentQuestionIndex = 0;
    score = 0;

    loadQuestion();
}

function loadQuestion() {
    clearInterval(timer);
    timeLeft = 20;
    document.getElementById("timer").textContent = `Time Left: ${timeLeft}s`;
    timer = setInterval(updateTimer, 1000);

    // Reset Explanation and Options from Previous Questions
    document.getElementById("explanation").textContent = "";
    document.getElementById("explanation").style.display = "none";
    let optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    let questionData = questions[selectedCategory][currentQuestionIndex];
    document.getElementById("question").textContent = questionData.question;

    if (questionData.type === "select") {
        questionData.options.forEach(option => {
            let div = document.createElement("div");
            div.textContent = option;
            div.classList.add("option");
            div.onclick = () => checkAnswer(option, questionData.answer, questionData.explanation);
            optionsContainer.appendChild(div);
        });
    } 
    
    else if (questionData.type === "reorder") {
        // Get the original options array
        const originalOptions = questionData.options;

        // Create a copy of the array to avoid modifying the original
        const optionsCopy = Array.from(originalOptions);

        const shuffledOptions = optionsCopy.sort(() => Math.random() - 0.5);

        let reorderList = document.createElement("div");
        reorderList.className = "reorder-list";

        shuffledOptions.forEach((option, index) => {
            let item = document.createElement("div");
            item.className = "reorder-item";
            item.textContent = option;
            item.draggable = true;
            item.id = `item-${index}`;

            item.addEventListener("dragstart", dragStart);
            item.addEventListener("dragover", dragOver);
            item.addEventListener("drop", drop);
            item.addEventListener("dragenter", dragEnter);
            item.addEventListener("dragleave", dragLeave);

            reorderList.appendChild(item);
        });

        optionsContainer.appendChild(reorderList);

        let submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit Answer";
        submitBtn.className = "submit-btn";
        submitBtn.onclick = () => checkReorderAnswer(questionData.answer, questionData.explanation);
        optionsContainer.appendChild(submitBtn);
    }
}

function endQuiz() {
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("end-menu").style.display = "block";
    document.getElementById("final-score").textContent = `Score: ${score}`;
}
