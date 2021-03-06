const KoaRouter = require('koa-router');
const { isValidationError, getFirstErrors } = require('../../lib/models/validation-error');

const router = new KoaRouter();

router.param('id', async (id, ctx, next) => {
  const user = await ctx.orm.user.findById(ctx.params.id);
  ctx.assert(user, 404);
  ctx.state.user = user;
  return next();
});

router.get('users', '/', async (ctx) => {
  const users = await ctx.orm.user.findAll();
  return ctx.render('users/index', {
    users,
    newUserPath: ctx.router.url('users-new'),
    getShowPath: user => ctx.router.url('users-show', user.id),
    getEditPath: user => ctx.router.url('users-edit', user.id),
    getDestroyPath: user => ctx.router.url('users-destroy', user.id),
  });
});

router.get('users-show', '/:id', async (ctx) => {
  ctx.body = ctx.state.user;
});

router.get('users-edit', '/:id/edit', (ctx) => {
  const { user } = ctx.state;
  return ctx.render(
    'users/edit',
    {
      user,
      submitPath: ctx.router.url('users-update', user.id),
    },
  );
});

router.patch('users-update', '/:id', async (ctx) => {
  const { user } = ctx.state;
  try {
    const params = ctx.request.body;
    if (!params.password) delete params.password;
    await user.update(params, { fields: ['firstName', 'lastName', 'email', 'password'] });
    ctx.redirect(ctx.router.url('users-show', user.id));
  } catch (error) {
    if (!isValidationError(error)) throw error;
    await ctx.render('users/edit', {
      user,
      errors: getFirstErrors(error),
      submitPath: ctx.router.url('users-update', user.id),
    });
  }
});

router.delete('users-destroy', '/:id', async (ctx) => {
  await ctx.state.user.destroy();
  ctx.redirect(ctx.router.url('users'));
});

module.exports = router;
