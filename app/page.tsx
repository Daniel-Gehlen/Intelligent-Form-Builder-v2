import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TypeIcon as FormIcon, BarChart3, Settings, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Intelligent Form Builder</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create smart forms with drag-and-drop interface, auto-fill capabilities, and powerful integrations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <FormIcon className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <CardTitle>Form Builder</CardTitle>
              <CardDescription>Drag-and-drop interface to create forms</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/builder">
                <Button className="w-full">Create Form</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View submissions and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  View Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 mx-auto text-purple-600 mb-2" />
              <CardTitle>Forms</CardTitle>
              <CardDescription>Manage your created forms</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/forms">
                <Button variant="outline" className="w-full">
                  My Forms
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Settings className="w-12 h-12 mx-auto text-orange-600 mb-2" />
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure integrations and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings">
                <Button variant="outline" className="w-full">
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold">Drag & Drop Builder</h3>
                <p className="text-gray-600 text-sm">Intuitive interface for creating forms</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold">Smart Auto-fill</h3>
                <p className="text-gray-600 text-sm">Intelligent field completion</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold">API Integrations</h3>
                <p className="text-gray-600 text-sm">CEP, CNPJ, and more</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold">Data Export</h3>
                <p className="text-gray-600 text-sm">CSV and JSON export</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold">Security</h3>
                <p className="text-gray-600 text-sm">CSRF protection and validation</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
              <div>
                <h3 className="font-semibold">Authentication</h3>
                <p className="text-gray-600 text-sm">JWT-based security</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
