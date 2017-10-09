module.exports = {
  // 'POST /proxy.json': require('./mock.json'),
  '/debug/*': function (req, res) {
    console.log(req.headers)
    console.log(req.body)
    res.json({ test: 11111 })
  },
}

