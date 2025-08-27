import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Zap, TrendingUp, Shield } from "lucide-react"

interface MCPScaffoldProps {
  title?: string
  description?: string
  features?: string[]
  variant?: "default" | "compact" | "detailed"
}

export function MCPScaffold({
  title = "MCP Integration Ready",
  description = "Model Context Protocol Integration Placeholder",
  features = [
    "AI-powered analysis and recommendations",
    "Real-time data processing and insights",
    "Adaptive learning from user interactions",
    "Secure and privacy-focused AI operations",
  ],
  variant = "default",
}: MCPScaffoldProps) {
  if (variant === "compact") {
    return (
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">MCP Ready</span>
          <Badge variant="outline" className="text-xs">
            AI Enhanced
          </Badge>
        </div>
        <p className="text-blue-700 text-xs">{description}</p>
      </div>
    )
  }

  if (variant === "detailed") {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">{title}</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              MCP Ready
            </Badge>
          </div>
          <CardDescription className="text-blue-700">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="mt-1">
                  {index === 0 && <Zap className="h-4 w-4 text-blue-600" />}
                  {index === 1 && <TrendingUp className="h-4 w-4 text-blue-600" />}
                  {index === 2 && <Bot className="h-4 w-4 text-blue-600" />}
                  {index === 3 && <Shield className="h-4 w-4 text-blue-600" />}
                </div>
                <span className="text-sm text-blue-800">{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Integration Status:</strong> This component is prepared for MCP agent integration. AI capabilities
              can be activated through the Model Context Protocol framework.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">MCP Ready</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
          <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
            {features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
