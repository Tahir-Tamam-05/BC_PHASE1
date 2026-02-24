import { Shield, Leaf, Globe, Mail } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-8">
          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              By accessing and using BlueCarbon Ledger, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold">2. Nature of Carbon Credits</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              BlueCarbon Ledger provides a platform for voluntary carbon offset credits from blue carbon ecosystems (mangroves, seagrass, salt marshes). These credits are:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Voluntary</strong> - Not compliant with mandatory emissions trading schemes</li>
              <li><strong>Not government-recognized</strong> - Not registered with any national or international carbon registry</li>
              <li><strong>For disclosure purposes only</strong> - Suitable for ESG and sustainability reporting</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-cyan-600" />
              <h2 className="text-xl font-semibold">3. User Responsibilities</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              As a user of BlueCarbon Ledger, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Provide accurate information during registration</li>
              <li>Submit only genuine project data and documentation</li>
              <li>Not misrepresent the nature or quantity of carbon credits</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Use the platform for its intended purpose</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">4. Project Submission & Verification</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Projects submitted to BlueCarbon Ledger undergo verification by independent verifiers. While we strive for accuracy, we do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>The accuracy of carbon sequestration calculations</li>
              <li>The legitimacy of submitted projects</li>
              <li>Continuous availability of the platform</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 dark:text-gray-300">
              All content, features, and functionality of BlueCarbon Ledger are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300">
              BlueCarbon Ledger shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the platform. The platform is provided "as is" without warranty of any kind.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">7. Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300">
              These terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms shall be resolved through appropriate legal channels.
            </p>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">8. Contact Information</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              For questions about these Terms of Service, please contact us through the platform or at support@bluecarbonledger.com
            </p>
          </section>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} BlueCarbon Ledger. All rights reserved.</p>
          <p className="mt-2">This is a voluntary carbon offset platform. Not a government-recognized carbon registry.</p>
        </div>
      </div>
    </div>
  );
}
