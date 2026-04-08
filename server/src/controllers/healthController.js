const getHealth = (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'text-to-learn-api',
  })
}

module.exports = {
  getHealth,
}
