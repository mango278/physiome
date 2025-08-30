import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { MCPScaffold } from "@/components/mcp-scaffold"
import { CheckInForm } from "@/components/check-in-form"
import { CheckInHistory } from "@/components/check-in-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CheckInPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user's workout plans for the check-in forms
  const { data: workoutPlans } = await supabase
    .from("workout_plans")
    .select("id, plan_name, exercises")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  // Get user's check-in history
  const { data: checkIns } = await supabase
    .from("check_ins")
    .select(`
      *,
      workout_plans (
        id,
        plan_name
      )
    `)
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Progress Check-in</h1>
          <p className="text-gray-600 mt-2">Track your recovery progress, pain levels, and exercise completion.</p>
        </div>

        <Tabs defaultValue="checkin" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checkin">New Check-in</TabsTrigger>
            <TabsTrigger value="history">Progress History</TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <CheckInForm userId={data.user.id} workoutPlans={workoutPlans || []} />
              </div>

              <div className="space-y-6">
                <MCPScaffold
                  title="Intelligent Progress Analysis"
                  description="AI-powered recovery insights and recommendations"
                  features={[
                    "Predictive recovery timeline analysis",
                    "Personalized exercise modifications",
                    "Trend analysis and early warning systems",
                    "Integration with healthcare provider dashboards",
                  ]}
                />

                {/* Quick Stats */}
                {checkIns && checkIns.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Progress</CardTitle>
                      <CardDescription>Your latest check-in summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{checkIns[0].pain_level}/10</div>
                          <div className="text-sm text-red-700">Pain Level</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{checkIns[0].mobility_score}/10</div>
                          <div className="text-sm text-green-700">Mobility Score</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-3">
                        Last check-in: {new Date(checkIns[0].created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <CheckInHistory checkIns={checkIns || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
