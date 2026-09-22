import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Trophy, Star, Heart, Sparkles } from "lucide-react";


const levelColors = {
  Bronze: "bg-amber-700 text-white",
  Silver: "bg-gray-400 text-gray-900",
  Gold: "bg-yellow-500 text-yellow-900",
  Platinum: "bg-purple-500 text-white",
};

const badgeIcons = {
  "First Donation": Heart,
  "Regular Supporter": Trophy,
  "Dedicated Donor": Star,
  "Major Contributor": Award,
  "Project Champion": Trophy,
  "Student Guardian": Heart,
  "Top Supporter": Sparkles,
  "New Donor": Award,
};

export default function DonorGamificationCard({
  currentLevel,
  totalPoints,
  rankingPosition,
  badgesEarned,
  pointsToNextLevel,
  progressPercentage,
  loading = false
}) {

  // Calculate level info based on points
  const getLevelInfo = (points) => {
    if (points >= 50000) return { level: 'Diamond', next: null };
    if (points >= 25000) return { level: 'Platinum', next: 50000 };
    if (points >= 10000) return { level: 'Gold', next: 25000 };
    if (points >= 2500) return { level: 'Silver', next: 10000 };
    if (points >= 500) return { level: 'Bronze', next: 2500 };
    return { level: 'Beginner', next: 500 };
  };

  const levelInfo = getLevelInfo(totalPoints || 0);
  const pointsNeeded = levelInfo.next ? levelInfo.next - (totalPoints || 0) : 0;
  const progress = levelInfo.next ? ((totalPoints || 0) / levelInfo.next) * 100 : 100;

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Achievement Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 animate-pulse">
              <Trophy className="h-10 w-10 text-gray-400" />
            </div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Achievement Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
            <Trophy className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <Badge 
              className={`${levelColors[levelInfo.level] || levelColors.Bronze} text-base px-4 py-1`}
              data-testid="badge-current-level"
            >
              {levelInfo.level}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold font-mono" data-testid="text-total-points">
              {(totalPoints || 0).toLocaleString()}
              {totalPoints > 0 && <span className="text-sm text-green-600 ml-1">pts</span>}
            </p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to next level</span>
            <span className="font-medium">{pointsNeeded} pts needed</span>
          </div>
          <Progress value={Math.min(Math.max(progress, 0), 100)} className="h-2" />
        </div>

        <div className="text-center p-3 bg-accent rounded-lg">
          <p className="text-sm text-muted-foreground">Regional Ranking</p>
          <p className="text-xl font-bold" data-testid="text-ranking-position">#{rankingPosition || 1}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">Earned Badges</h4>
          <div className="grid grid-cols-2 gap-2">
            {(badgesEarned || []).map((badge) => {
              const BadgeIcon = badgeIcons[badge] || Star;
              return (
                <div
                  key={badge}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card border hover-elevate"
                  data-testid={`badge-earned-${badge.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="h-10 w-10 rounded-full bg-chart-4/20 flex items-center justify-center">
                    <BadgeIcon className="h-5 w-5 text-chart-4" />
                  </div>
                  <p className="text-xs text-center font-medium leading-tight">{badge}</p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
