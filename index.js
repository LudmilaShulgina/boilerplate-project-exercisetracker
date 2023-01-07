const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
mongoose.connect(process.env.MONGO_URI);

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});

const userSchema = new mongoose.Schema({
  username: String,
});

const User = mongoose.model("User", userSchema, "users");
const Exercise = mongoose.model("Exercise", exerciseSchema, "exercises");

const getUserById = async (id) => {
  return User.findById(id, function(err, data) {
    if (err) return console.log(err);
    return data;
  });
};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route("/api/users")
    .post((req, res) => {
      const username = req.body.username
      const newUser = new User({ username });

      newUser.save(function(err, data) {
        if (err) return console.error(err);
        res.json(data)
      });
    })
    .get((req, res) => {
      User.find({}, function(err, data) {
        if (err) return console.log(err);
        res.json(data);
      });

    });

app.post("/api/users/:_id/exercises", async (req, res) => {
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString();
  const user = await getUserById(req.params._id);
  const newExercise = new Exercise({ description, duration, date, username: user.username });

  newExercise.save(function(err, data) {
    if (err) return console.error(err);
    const {username, _id} = user;
    const {description, duration, date} = data;

    res.json({description, duration, date, username, _id})
  });
})

app.get("/api/users/:_id/logs", async (req, res) => {
  const {limit, from, to}= req.query
  const user = await getUserById(req.params._id);
  Exercise
      .find({username: user.username})
      .select({ __v: 0 })
      .exec(function(error, data) {
        if (error) console.log(error);
        let exercises = [...data]
        if (from) {
          exercises = exercises.filter(exercise => new Date(exercise.date) >= new Date(from))
        }
        if (to) {
          exercises = exercises.filter(exercise => new Date(exercise.date) <= new Date(to))
        }
        if(limit) {
          exercises.length = Math.min(exercises.length, limit);
        }

        res.json({count: exercises.length, log:exercises  })
      });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
