import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { MCPScaffold } from "@/components/mcp-scaffold"
import { WorkoutPlanList } from "@/components/workout-plan-list"
import { CreateWorkoutPlanForm } from "@/components/create-workout-plan-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function WorkoutPlanPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user's workout plans
  const { data: workoutPlans } = await supabase
    .from("workout_plans")
    .select(`
      *,
      injury_hypotheses (
        id,
        hypothesis,
        symptoms
      )
    `)
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  // Get user's injury hypotheses for the create form
  const { data: injuryHypotheses } = await supabase
    .from("injury_hypotheses")
    .select("id, hypothesis, symptoms, created_at")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workout Plans</h1>
          <p className="text-gray-600 mt-2">
            Personalized exercise routines designed for your recovery and fitness goals.
          </p>
        </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">My Plans</TabsTrigger>
            <TabsTrigger value="create">Create New Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <WorkoutPlanList plans={workoutPlans || []} />

            <MCPScaffold
              title="Adaptive Workout Intelligence"
              description="AI-powered exercise optimization and progression"
              features={[
                "Real-time form analysis and correction feedback",
                "Adaptive difficulty progression based on performance",
                "Integration with fitness trackers and biometric data",
                "Personalized recovery and rest day recommendations",
              ]}
            />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <CreateWorkoutPlanForm userId={data.user.id} injuryHypotheses={injuryHypotheses || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
