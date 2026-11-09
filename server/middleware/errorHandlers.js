function notFound(req, res) {
  res.status(404).json({ error: "Not found." });
}

function errorHandler(err, req, res, next) {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Email and password are required." });
  }

  console.error(err.message);
  res.status(500).json({ error: "Something went wrong." });
}

module.exports = { notFound, errorHandler };