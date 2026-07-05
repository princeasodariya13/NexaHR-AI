export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Feature Disabled</h1>
        <p className="text-gray-500">
          The Supabase password recovery flow has been disabled due to the migration to MongoDB and NextAuth. Please contact your administrator to reset your password.
        </p>
      </div>
    </div>
  );
}
