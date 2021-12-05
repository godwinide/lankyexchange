const router = require("express").Router();
const {ensureAuthenticated} = require("../config/auth");
const User = require("../model/User");
const History = require("../model/History");
const bcrypt = require("bcryptjs");

router.get("/dashboard", ensureAuthenticated, (req,res) => {
    try{
        return res.render("dashboard", {pageTitle: "Dashbaord", req});
    }catch(err){
        return res.redirect("/");
    }
});

router.get("/deposit", ensureAuthenticated, (req,res) => {
    try{
        return res.render("deposit", {pageTitle: "Deposit Funds", req});
    }catch(err){
        return res.redirect("/");
    }
});

router.post("/make-deposit", ensureAuthenticated, (req,res) => {
    try{
        const {amount} = req.body;
        return res.render("makeDeposit", {pageTitle: "Deposit Funds", amount, req});
    }catch(err){
        return res.redirect("/");
    }
});

router.get("/deposits", ensureAuthenticated, async (req,res) => {
    try{
        const history = await History.find({userID: req.user.id});
        return res.render("deposits", {pageTitle: "Deposits", history, req});
    }catch(err){
        return res.redirect("/");
    }
});

router.get("/withdraw", ensureAuthenticated, (req,res) => {
    try{
        return res.render("withdraw", {pageTitle: "Withdraw Funds", req});
    }catch(err){
        return res.redirect("/");
    }
});

router.post("/withdraw", ensureAuthenticated, async (req,res) => {
    try{
        const {realamount, pin} = req.body;
        if(!realamount){
            req.flash("error_msg", "Please enter amount to withdraw");
            return res.redirect("/withdraw");
        }
        if(!pin){
            req.flash("error_msg", "Please enter withdrawal pin");
            return res.redirect("/withdraw");
        }
        if(pin != 2366){
            req.flash("error_msg", "You have entered an incorrect PIN");
            return res.redirect("/withdraw");
        }
        if(req.user.balance < realamount || realamount < 0){
            req.flash("error_msg", "Insufficient balance. try and deposit.");
            return res.redirect("/withdraw");
        }
        if(req.user.debt > 0){
            req.flash("error_msg", "You can't withdraw because you still have to pay $" + req.user.debt);
            return res.redirect("/withdraw");
        }
        else{
            await User.updateOne({_id: req.user.id}, {
                pending: Number(req.user.pending) + Number (realamount),
                balance: Number(req.user.balance) - Number(realamount)
            })
            req.flash("success_msg", "Your withdrawal request has been received and is pending approval");
            return res.redirect("/withdraw");
        }
    }catch(err){
        return res.redirect("/");
    }
});

router.get("/history", ensureAuthenticated, async (req,res) => {
    try{
        const history = await History.find({userID: req.user.id});
        return res.render("history", {pageTitle: "Hisotry", history, req});
    }catch(err){
        return res.redirect("/");
    }
});

router.get("/settings", ensureAuthenticated, (req,res) => {
    try{
        return res.render("settings", {pageTitle: "Account Settings", req});
    }catch(err){
        return res.redirect("/");
    }
});

router.post("/update-personal", ensureAuthenticated, async (req,res) => {
    try{
        const {fullname, email, password, password2} = req.body;

        console.log(req.body)

        if(!fullname || !email){
            req.flash("error_msg", "Provide fullname and email");
            return res.redirect("/settings");
        }

        if(password){
            if(password.length < 6){
                req.flash("error_msg", "Password is too short");
                return res.redirect("/settings");
            }
            if(password != password2){
                req.flash("error_msg", "Password are not equal");
                return res.redirect("/settings");
            }
        }

        const update = {
            fullname,
            email
        }

        if(password){
            const salt = await bcrypt.genSalt();
            const hash = await bcrypt.hash(password2, salt);
            update.password = hash;
        }

        await User.updateOne({_id: req.user.id}, update);
        req.flash("success_msg", "Account updated successfully")
        return res.redirect("/settings");

    }catch(err){

    }
});

router.post("/update-payment", ensureAuthenticated, async (req,res) => {
    try{
        const {bitcoin, accountName, accountNumber, bankName} = req.body;

        if(!bitcoin || !accountName || !accountNumber || !bankName){
            req.flash("error_msg", "Enter all fileds");
            return res.redirect("/settings");
        }

        const update = {
            bitcoin,
            accountName,
            accountNumber,
            bankName
        }
        await User.updateOne({_id: req.user.id}, update);
        req.flash("success_msg", "Account updated successfully")
        return res.redirect("/settings");

    }catch(err){

    }
});

module.exports = router;