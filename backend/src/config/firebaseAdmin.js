import admin from "firebase-admin";
import serviceAccount from "../../caregiver-mobile-application-firebase-adminsdk-fbsvc-392e8c1f74.json" with { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
