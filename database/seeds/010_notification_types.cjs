const schema = process.env.DB_SCHEMA || 'public';

const types = [{
  code: 'playlist_invite',
  title: 'Playlist Invitation',
  description: 'User invited you to join a playlist',
  requires_action: true
}, {
  code: 'admin_announcement',
  title: 'Admin Announcement',
  description: 'Important announcement from administration',
  requires_action: false
}, {
  code: 'system_notification',
  title: 'System Notification',
  description: 'General system notification',
  requires_action: false
}]

exports.seed = async function(knex) {
  await knex(`${schema}.notification_types`).insert(types);
};
