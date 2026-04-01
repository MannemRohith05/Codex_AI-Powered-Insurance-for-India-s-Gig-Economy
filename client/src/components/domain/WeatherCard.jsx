import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { CloudRain, Sun, ThermometerSun, AlertTriangle } from "lucide-react";

export function WeatherCard({ type = "rain", title, description, severity = "low", isActive }) {
  const isHighRisk = severity === "high";

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 ${isActive ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
        {type === "rain" && <CloudRain className="h-4 w-4 text-blue-500" />}
        {type === "heat" && <ThermometerSun className="h-4 w-4 text-orange-500" />}
        {type === "aqi" && <AlertTriangle className="h-4 w-4 text-red-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isHighRisk ? "Alert" : "Normal"}</div>
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
        
        {isHighRisk && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
            High risk detected. Protect shift.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
