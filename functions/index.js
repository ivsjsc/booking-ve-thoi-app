const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Callable function to set custom claims (role) for a user
// Only callable by an account that already has the 'admin' custom claim
exports.setCustomClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const callerUid = context.auth.uid;
  const caller = await admin.auth().getUser(callerUid);
  if (!caller.customClaims || !caller.customClaims.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can modify roles.');
  }

  const { uid, role } = data;
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Request must contain uid and role.');
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    return { success: true };
  } catch (err) {
    throw new functions.https.HttpsError('internal', 'Error while setting custom claims', err);
  }
});
