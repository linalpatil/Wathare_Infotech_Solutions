const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./models/Users');

const app = express();
app.use(cors());
app.use(express.json());

app.use((err, req, res, next) => {
    if (err.name === 'ValidationError') {
        return res.status(422).json(err.errors);
    }
    next(err);
});

mongoose.connect("mongodb+srv://linalpatil72:jhOcdD1NU71xphZO@cluster0.lmntodn.mongodb.net/users", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.get("/getData", (req, res) => {
    UserModel.find({})
        .then(users => {
            res.json(users);
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

app.get("/filterData", (req, res) => {
    const { startDate, endDate, frequency } = req.query;

    if (!startDate || !endDate || !frequency) {
        return res.status(400).json({ error: "Missing required query parameters are : startDate, endDate, or frequency." });
    }

    let format;
    switch (frequency) {
        case 'hour': format = 'YYYY-MM-DD HH'; break;
        case 'day': format = 'YYYY-MM-DD'; break;
        case 'week': format = 'YYYY WW'; break;
        case 'month': format = 'YYYY-MM'; break;
        default: return res.status(400).json({ error: "Invalid frequency type. Use 'hour', 'day', 'week', or 'month'." });
    }

    UserModel.aggregate([
        {
            $match: {
                ts: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        },
        {
            $project: {
                yearMonthDayHour: { $dateToString: { format: format, date: "$ts" } },
                machine_status: 1,
                vibration: 1
            }
        },
        {
            $group: {
                _id: "$yearMonthDayHour",
                machine_status: { $first: "$machine_status" },
                vibration: { $first: "$vibration" }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ])
    .then(results => res.json(results))
    .catch(err => res.status(500).json({ error: "Failed to filter data", details: err }));
});


app.post("/insertData", async (req, res) => {
    const { ts, machine_status, vibration } = req.body;

    if (ts === undefined || machine_status === undefined || vibration === undefined) {
        return res.status(400).json({
            error: "Missing required fields: ts, machine_status, or vibration"
        });
    }

    const newUser = new UserModel({
        ts: new Date(ts),  
        machine_status: machine_status,
        vibration: vibration
    });

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser); 
    } catch (err) {
        console.error(err); 
        res.status(500).json({ error: "Failed to insert data", details: err });
    }
});

app.delete("/deleteData", async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).send("Please provide an ID to delete the data");
    }

    try {
        const deleted = await UserModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).send("User not found with provided ID");
        }
        res.send("Deleted Successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

app.listen(5095, () => {
    console.log('server is running');
});