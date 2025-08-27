import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Physio</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your intelligent physiotherapy companion. Get personalized injury assessments, workout plans, and track your
            recovery progress with AI-powered insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>🩺 Smart Injury Assessment</CardTitle>
              <CardDescription>
                Describe your symptoms and get AI-powered injury hypotheses with confidence scores
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💪 Personalized Workouts</CardTitle>
              <CardDescription>
                Receive customized exercise plans tailored to your specific injury and recovery stage
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Progress Tracking</CardTitle>
              <CardDescription>Monitor your pain levels, mobility, and recovery progress over time</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🤖 MCP Integration</CardTitle>
              <CardDescription>
                Enhanced AI capabilities through Model Context Protocol for advanced recommendations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500">Start your AI-powered physiotherapy journey today</p>
        </div>
      </div>
    </div>
  )
}
