import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { MCPScaffold } from "@/components/mcp-scaffold"
import { InjuryAssessmentForm } from "@/components/injury-assessment-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function InjuryPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: recentHypotheses } = await supabase
    .from("injury_hypothesis")
    .select("id, created_at, subjective, differentials, status")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Injury Assessment</h1>
          <p className="text-gray-600 mt-2">
            Describe your symptoms and get AI-powered injury hypotheses to guide your recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <InjuryAssessmentForm userId={data.user.id} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Assessments</CardTitle>
                <CardDescription>Your previous injury hypotheses</CardDescription>
              </CardHeader>
              <CardContent>
                {recentHypotheses && recentHypotheses.length > 0 ? (
                  <div className="space-y-4">
                    {recentHypotheses.map((hypothesis) => {
                      const differentials = hypothesis.differentials as any
                      const hypothesisText = differentials?.hypothesis || "Assessment completed"
                      const confidenceScore = differentials?.confidence_score || 5

                      return (
                        <div key={hypothesis.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">Assessment</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(hypothesis.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Symptoms:</strong> {hypothesis.subjective}
                          </p>
                          <p className="text-sm text-gray-800 mb-2">
                            <strong>Hypothesis:</strong> {hypothesisText}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-blue-600">Confidence: {confidenceScore}/10</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(confidenceScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No previous assessments found.</p>
                )}
              </CardContent>
            </Card>

            <MCPScaffold
              title="Advanced Injury Analysis"
              description="Enhanced AI diagnostic capabilities"
              features={[
                "Multi-modal symptom analysis (text, images, movement patterns)",
                "Differential diagnosis with medical literature integration",
                "Risk factor assessment and prevention recommendations",
                "Integration with healthcare provider systems",
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
