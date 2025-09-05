import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, BarChart3, Settings } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Quiz Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A comprehensive platform for creating, managing, and taking quizzes. 
            Perfect for educators and students alike.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Student Portal</CardTitle>
                  <CardDescription>
                    Take quizzes and view your results
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Access available quizzes, attempt them, and get instant feedback 
                with pass/fail results based on your performance.
              </p>
              <div className="space-y-2">
                <Link href="/student">
                  <Button className="w-full">
                    Student Login
                  </Button>
                </Link>
                <Link href="/student/register">
                  <Button variant="outline" className="w-full">
                    New Student? Register
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Admin Portal</CardTitle>
                  <CardDescription>
                    Create and manage quizzes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create quizzes with multiple-choice and true/false questions, 
                set passing criteria, and view detailed results.
              </p>
              <Link href="/admin">
                <Button className="w-full" variant="outline">
                  Enter as Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Features</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-6">
              <div className="p-3 bg-purple-100 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Quiz Creation</h3>
              <p className="text-gray-600 text-center">
                Create comprehensive quizzes with multiple question types and customizable settings.
              </p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="p-3 bg-orange-100 rounded-full mb-4">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analytics</h3>
              <p className="text-gray-600 text-center">
                Track student performance and get detailed insights into quiz results.
              </p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="p-3 bg-teal-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">User Management</h3>
              <p className="text-gray-600 text-center">
                Role-based access control for admins and students with secure authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
