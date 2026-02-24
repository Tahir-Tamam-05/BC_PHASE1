import { Shield, Eye, Lock, Database, Trash2, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-8">
          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">1. Introduction</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              BlueCarbon Ledger ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, disclosed, and safeguarded when you use our platform.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
              <li><strong>Profile Information:</strong> Role (contributor, buyer, verifier, admin), location</li>
              <li><strong>Project Data:</strong> Project details, GIS boundaries, carbon calculations, verification documents</li>
              <li><strong>Transaction Data:</strong> Credit purchases, certificate generation records</li>
              <li><strong>Usage Data:</strong> Access logs, API interactions (for security purposes)</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-cyan-600" />
              <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your information is used for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Providing and maintaining the platform</li>
              <li>Verifying projects and carbon credits</li>
              <li>Processing credit transactions</li>
              <li>Generating certificates</li>
              <li>Communicating with you about your account</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">4. Data Storage & Security</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Passwords are encrypted using industry-standard hashing</li>
              <li>Data is stored in secure, access-controlled databases</li>
              <li>Blockchain records are immutable and publicly visible</li>
              <li>SSL/TLS encryption for data in transit</li>
              <li>Regular security reviews and updates</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">5. Data Sharing & Disclosure</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may share information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>With Verifiers:</strong> Project details for verification purposes</li>
              <li><strong>Public Blockchain:</strong> Transaction records are permanently stored on the blockchain</li>
              <li><strong>Legal Compliance:</strong> When required by law or to protect rights</li>
              <li><strong>Service Providers:</strong> With trusted third parties who assist our operations</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              We <strong>do not sell</strong> your personal information to third parties.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold">6. Data Retention & Deletion</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You may request deletion of your account and personal data. However:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Blockchain records cannot be modified or deleted (immutable)</li>
              <li>Some data may be retained for legal compliance</li>
              <li>Project data associated with verified credits must be preserved</li>
              <li>Audit logs are retained for security purposes</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Under applicable data protection laws, you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request data deletion (subject to blockchain constraints)</li>
              <li>Object to processing</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">8. Cookies & Tracking</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We use minimal cookies for authentication and session management. We do not use third-party tracking or advertising cookies. All analytics are performed on aggregated, anonymized data.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Our platform is not intended for children under 13. We do not knowingly collect personal information from children. If we become aware of such collection, we will delete the information promptly.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may update this Privacy Policy periodically. We will notify users of any material changes via email or platform notification. Your continued use of the platform after such changes constitutes acceptance of the new policy.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">11. Contact Us</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              For questions about this Privacy Policy or to exercise your rights, please contact us at privacy@bluecarbonledger.com
            </p>
          </section>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} BlueCarbon Ledger. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
