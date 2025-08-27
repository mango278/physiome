import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { MCPScaffold } from "@/components/mcp-scaffold"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get recent activity counts
  const { data: recentHypotheses } = await supabase
    .from("injury_hypotheses")
    .select("id")
    .eq("user_id", data.user.id)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const { data: activeWorkoutPlans } = await supabase.from("workout_plans").select("id").eq("user_id", data.user.id)

  const { data: recentCheckIns } = await supabase
    .from("check_ins")
    .select("id")
    .eq("user_id", data.user.id)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.full_name || "User"}!</h1>
          <p className="text-gray-600 mt-2">Your AI-powered physiotherapy journey continues here.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{recentHypotheses?.length || 0}</p>
                  <p className="text-sm text-gray-500">Assessments</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🩺</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{activeWorkoutPlans?.length || 0}</p>
                  <p className="text-sm text-gray-500">Workout Plans</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">💪</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{recentCheckIns?.length || 0}</p>
                  <p className="text-sm text-gray-500">Check-ins</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🩺 Injury Assessment</CardTitle>
              <CardDescription>Get AI-powered injury hypothesis based on your symptoms</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/injury">Start Assessment</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">💪 Workout Plans</CardTitle>
              <CardDescription>Personalized exercise routines for your recovery</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/plan">View Plans</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📊 Progress Check-in</CardTitle>
              <CardDescription>Track your recovery progress and pain levels</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/check-in">Check In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* MCP Scaffolding */}
        <MCPScaffold
          title="AI Dashboard Enhancement"
          description="Advanced AI capabilities for comprehensive health monitoring"
          features={[
            "Predictive recovery analytics and timeline estimation",
            "Personalized treatment recommendations based on progress",
            "Integration with wearable devices and health data",
            "Real-time coaching and form correction guidance",
          ]}
          variant="detailed"
        />
      </div>
    </div>
  )
}
