//Feature to think about or add. Headers to give frontend a heads up about your rates and limits. 

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

//General limiters 
//Post Login Route
const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many login attempts. Try again later." },
    keyGenerator: (req) => {
        if (req.user?.id) return req.user.id; // logged-in users
        return ipKeyGenerator(req);           // fallback to IP
    }

});

//refresh, let brower know its the same person. 
const loginMeLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many refresh in 15 mins damn calm down." },
    keyGenerator: (req) => {
        if (req.user?.id) return req.user.id;
        return ipKeyGenerator(req);
    }
});

// Post Signup Route 
const signupLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "Too many accounts created. Try again later." },
    keyGenerator: (req) => {
        if (req.user?.id) return req.user.id;
        return ipKeyGenerator(req);
    }
});

// Post upload TUS Route 
const uploadLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many upload requests. Try again later." },
    keyGenerator: (req) => {
        if (req.user?.id) return req.user.id;
        return ipKeyGenerator(req);
    }
});




//Movies Route  Limiter
//Get Route
const movieHomepageLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests. Slow down." }
});

// Get Route single
const movieSingleLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests. Slow down." }
});

// Get Route Profile movies 
const movieMyMovieLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: { error: "Too many requests. Chill a bit." }
});

// Delete a movie 
const movieDeleteLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many delete attempts." },
    keyGenerator: (req) => {
        if (req.user?.id) return req.user.id;
        return ipKeyGenerator(req);
    }
});


//Users Route Limiter 
// Post route for uploading movie poster, limit
const userPosterLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many uploads. Try again later." },
    keyGenerator: (req) => {
        if (req.user?.id) return req.user.id;
        return ipKeyGenerator(req);
    }
});

// Get user profile  
const userProfileLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    message: { error: "Too many profile requests." }
});

// Delete user profile and its movies 
const userDeleteAccLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: "Too many account deletion attempts." },
    keyGenerator: (req) => {
        if (req.user?.id) return req.user.id;
        return ipKeyGenerator(req);
    }
});

const userLogoutLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    keyGenerator: (req) => {
        if (req.user?.id) return req.user.id;
        return ipKeyGenerator(req);
    }
});

module.exports = {
    loginLimit, loginMeLimit, signupLimit, uploadLimit, movieHomepageLimit,
    movieSingleLimit, movieMyMovieLimit, movieDeleteLimit,
    userPosterLimit, userProfileLimit, userDeleteAccLimit, userLogoutLimit
}
