const getUserData = (req, res) => {
  // Removing password
  const { password, ...safeUser } = req.user;

  // Since we already got the logged in user from the middlware we just return it.
  res.status(200).json(safeUser);
};

export { getUserData };
