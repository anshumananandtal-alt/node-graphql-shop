exports.get404 = (req, res, next) => {
  res.status(404).render('404', {
    pageTitle: 'Page Not Found',
    path: '/404',
    isAuthenticated: req.session.isLoggedIn
  });
};


exports.getError = (req, res, next) => {
  console.log(req.session)
  res.status(500).render('error', {
    pageTitle: 'Error occured',
    path: '/error',
    isAuthenticated: req?.session?.isLoggedIn || false
  });
};
