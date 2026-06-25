let redBallRef = null;
let blueBallRef = null;

document.addEventListener("DOMContentLoaded", () => {

    const redBall = document.getElementById("red-object");
    const blueBall = document.getElementById("blue-object");

    const resetButton = document.getElementById("reset-button");

    if (redBall) {
        redBall.radius = redBall.offsetWidth / 2;
        redBall.x = 50;
        redBall.y = (window.innerHeight / 2) - redBall.radius;

        redBall.vx = 0;
        redBall.vy = 0;
        redBallRef = redBall;
    }

    if (blueBall) {
        blueBall.radius = blueBall.offsetWidth / 2;

        blueBall.x = window.innerWidth - 50 - (blueBall.radius * 2);
        blueBall.y = (window.innerHeight / 2) - blueBall.radius;

        blueBall.vx = 0;
        blueBall.vy = 0;
        blueBallRef = blueBall;
    }

    // Assign initial random velocities right after setting up the objects
    if (redBall && blueBall) {
        give_initial_speed(redBall, blueBall);
    }

    // Floating Reset Button Logic
    if (resetButton) {
        resetButton.addEventListener("click", () => {
            // Send red ball back to Left Middle
            if (redBall) {
                redBall.x = 50;
                redBall.y = (window.innerHeight / 2) - redBall.radius;
                redBall.vx = 0;
                redBall.vy = 0;
            }

            // Send blue ball back to Right Middle
            if (blueBall) {
                blueBall.x = window.innerWidth - 50 - (blueBall.radius * 2);
                blueBall.y = (window.innerHeight / 2) - blueBall.radius;
                blueBall.vx = 0;
                blueBall.vy = 0;
            }

            // Give them a new random speed vector upon reset!
            if (redBall && blueBall) {
                give_initial_speed(redBall, blueBall);
            }
        });
    }

    // Call the main game loop 60 times a second (approx. 16.67ms intervals)
    setInterval(main_threat, 1000 / 60);
});

function calculate_attraction(obj1, obj2, k = 100) {
    let dx = obj2.x - obj1.x;
    let dy = obj2.y - obj1.y;

    let abs_distance = Math.sqrt(dx * dx + dy * dy);

    return k / (abs_distance * 2);
}

function calculate_wall_repulsion(obj) {
    const border = 20; // 20px CSS border
    const wallG = 100; // Force scalar multiplier

    const minX = border;
    const minY = border;
    const maxX = window.innerWidth - border;
    const maxY = window.innerHeight - border;

    let centerX = obj.x + obj.radius;
    let centerY = obj.y + obj.radius;

    // 1. Left Wall: Only brake if moving LEFT (vx < 0)
    let distLeft = centerX - minX;
    if (distLeft > 0 && obj.vx < 0) {
        let forceLeft = wallG / distLeft ** 2;
        obj.vx += forceLeft; // Pushes right to slow down the left movement
        if (obj.vx > 0) obj.vx = 0; // Prevent it from turning into a positive bounce
    }

    // 2. Right Wall: Only brake if moving RIGHT (vx > 0)
    let distRight = maxX - centerX;
    if (distRight > 0 && obj.vx > 0) {
        let forceRight = wallG / distRight ** 2;
        obj.vx -= forceRight; // Pushes left to slow down the right movement
        if (obj.vx < 0) obj.vx = 0; // Prevent it from turning into a negative bounce
    }

    // 3. Top Wall: Only brake if moving UP (vy < 0)
    let distTop = centerY - minY;
    if (distTop > 0 && obj.vy < 0) {
        let forceTop = wallG / distTop ** 2;
        obj.vy += forceTop; // Pushes down to slow down the upward movement
        if (obj.vy > 0) obj.vy = 0; // Prevent it from turning into a downward bounce
    }

    // 4. Bottom Wall: Only brake if moving DOWN (vy > 0)
    let distBottom = maxY - centerY;
    if (distBottom > 0 && obj.vy > 0) {
        let forceBottom = wallG / distBottom ** 2;
        obj.vy -= forceBottom; // Pushes up to slow down the downward movement
        if (obj.vy < 0) obj.vy = 0; // Prevent it from turning into an upward bounce
    }
}

function break_in_vector(obj1, obj2) {
    // 1. Apply the new invisible magnetic wall cushion to both objects
    calculate_wall_repulsion(obj1);
    calculate_wall_repulsion(obj2);

    // 2. Object vs Object Collision Detection (Keep this exactly as it was!)
    let dx = obj2.x - obj1.x;
    let dy = obj2.y - obj1.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let minDistance = obj1.radius + obj2.radius + 5;

    if (distance < minDistance) {
        // Reverse velocities with an acceleration boost (1.1)
        obj1.vx = -obj1.vx * 1.1;
        obj1.vy = -obj1.vy * 1.1;
        obj2.vx = -obj2.vx * 1.1;
        obj2.vy = -obj2.vy * 1.1;

        // Prevent clipping: Separate the balls slightly so they don't lock together
        let overlap = minDistance - distance;
        let nx = dx / (distance || 1);
        let ny = dy / (distance || 1);

        obj1.x -= nx * (overlap / 2);
        obj1.y -= ny * (overlap / 2);
        obj2.x += nx * (overlap / 2);
        obj2.y += ny * (overlap / 2);
    }
}



function calculate_two_vectors(object_a, object_b, force) {
    let dx = object_b.x - object_a.x;
    let dy = object_b.y - object_a.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { ax: 0, ay: 0 };

    // Standard vector breakdown: acceleration components = force * directional ratio
    let ax = force * (dx / distance);
    let ay = force * (dy / distance);

    return { ax, ay };
}

function move(obj, vx, vy) {
    let dt = 1 / 60; // 1/60th of a second execution steps
    const border = 20; // Your CSS border thickness

    // 1. Calculate the intended next position
    let nextX = obj.x + vx * dt;
    let nextY = obj.y + vy * dt;

    // 2. Establish safe boundary limits accounting for the ball's size
    const minX = border;
    const maxX = window.innerWidth - border - (obj.radius * 2);
    const minY = border;
    const maxY = window.innerHeight - border - (obj.radius * 2);

    // 3. Check if space is left; if not, clamp precisely to the border
    if (nextX < minX) {
        nextX = minX;
    } else if (nextX > maxX) {
        nextX = maxX;
    }

    if (nextY < minY) {
        nextY = minY;
    } else if (nextY > maxY) {
        nextY = maxY;
    }

    // 4. Update the object's internal tracking coordinates
    obj.x = nextX;
    obj.y = nextY;

    // 5. Apply properties cleanly into the DOM style properties
    obj.style.left = obj.x + "px";
    obj.style.top = obj.y + "px";
}

function give_initial_speed(object1, object2) {
    // Assign some random initial speed to object 1 and 2, and the speed must be in range 0 < x < 50. 
    [object1, object2].forEach(obj => {
        // Generate a random overall speed magnitude between 0.1 and 49.9 pixels/sec
        let speed = (Math.random() * 100) + 10;

        // Generate a random heading angle in radians (0 to 360 degrees)
        let angle = Math.random() * Math.PI * 2;

        // Break down the master speed scalar into horizontal and vertical vector velocities
        obj.vx = speed * Math.cos(angle);
        obj.vy = speed * Math.sin(angle);
    });
}

function main_threat() {
    const obj1 = redBallRef;
    const obj2 = blueBallRef;

    // Ensure data handles are ready
    if (!obj1 || !obj2) return;

    // 1. Calculate overall attraction magnitude (Low k keeps speed manageable!)
    let forceMagnitude = calculate_attraction(obj1, obj2, 1000);

    // 2. Calculate two vector accelerations for both objects
    let acceleration1 = calculate_two_vectors(obj1, obj2, forceMagnitude);
    obj1.vx += acceleration1.ax;
    obj1.vy += acceleration1.ay;

    let acceleration2 = calculate_two_vectors(obj2, obj1, forceMagnitude);
    obj2.vx += acceleration2.ax;
    obj2.vy += acceleration2.ay;

    // Run collision tests to adjust boundaries and perform repel calculations
    break_in_vector(obj1, obj2);

    // 3. Move both objects smoothly
    move(obj1, obj1.vx, obj1.vy);
    move(obj2, obj2.vx, obj2.vy);
}