const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {

  const {
    Employees,
    SatisfactionSurvey,
    Feedback,
    PerformanceMetrics,
    AttritionRisk,
    TrainingRecommendation,
    OpenPositions,
    EngagementIdea,
    PolicyEnhancement
  } = this.entities;
  
  // Before creating new employees, validate manager relationship
  this.before('CREATE', 'Employees', async (req) => {
    const { ManagerID } = req.data;
    if (ManagerID) {
      const manager = await SELECT.one.from(Employees).where({ ID: ManagerID });
      if (!manager) {
        req.error(400, `Manager with ID ${ManagerID} does not exist`);
      }
    }
  });
  
  // Before creating feedback, validate that FromUser and Employee are different
  this.before('CREATE', 'Feedback', async (req) => {
    const { EmployeeID_ID, FromUserID_ID } = req.data;
    if (EmployeeID_ID === FromUserID_ID) {
      req.error(400, 'Employee cannot provide feedback to themselves');
    }
  });

  // Before creating satisfaction survey, validate score range
  this.before(['CREATE', 'UPDATE'], 'SatisfactionSurvey', async (req) => {
    const { Score } = req.data;
    if (Score < 0 || Score > 100) {
      req.error(400, 'Satisfaction score must be between 0 and 100');
    }
  });
  
  // Before creating performance metrics, validate score and goals
  this.before(['CREATE', 'UPDATE'], 'PerformanceMetrics', async (req) => {
    const { Score, GoalsMet, ManagerRating } = req.data;

    if (Score !== undefined && (Score < 0 || Score > 5)) {
      req.error(400, 'Performance score must be between 0.00 and 5.00');
    }

    if (GoalsMet !== undefined && (GoalsMet < 0 || GoalsMet > 100)) {
      req.error(400, 'Goals met percentage must be between 0 and 100');
    }

    if (ManagerRating !== undefined && (ManagerRating < 0 || ManagerRating > 10)) {
      req.error(400, 'Manager rating must be between 0 and 10');
    }
  });
  
  // Action: Generate attrition risk analysis
  this.on('generateAttritionRisk', async (req) => {
    const { employeeId } = req.data;
    
    try {
      // Get employee data
      const employee = await SELECT.one.from(Employees).where({ ID: employeeId });
      if (!employee) {
        req.error(404, `Employee with ID ${employeeId} not found`);
      }
      
      // Get recent performance data
      const performance = await SELECT.from(PerformanceMetrics)
        .where({ EmployeeID_ID: employeeId })
        .limit(3);

      // Get recent satisfaction scores
      const satisfaction = await SELECT.from(SatisfactionSurvey)
        .where({ EmployeeID_ID: employeeId })
        .limit(3);
      
      // Simple risk calculation (in real implementation, this would use ML)
      let riskScore = 0.1; // Base risk
      
      // Performance factor
      if (performance.length > 0) {
        const avgPerformance = performance.reduce((sum, p) => sum + p.Score, 0) / performance.length;
        if (avgPerformance < 2.5) riskScore += 0.3;
        else if (avgPerformance < 3.5) riskScore += 0.1;
      }
      
      // Satisfaction factor (0-100 scale)
      if (satisfaction.length > 0) {
        const avgSatisfaction = satisfaction.reduce((sum, s) => sum + s.Score, 0) / satisfaction.length;
        if (avgSatisfaction < 50) riskScore += 0.4;
        else if (avgSatisfaction < 70) riskScore += 0.2;
      }
      
      // Tenure factor
      const hireDate = new Date(employee.HireDate);
      const tenure = (new Date() - hireDate) / (1000 * 60 * 60 * 24 * 365); // years
      if (tenure < 1) riskScore += 0.2;
      else if (tenure > 5) riskScore -= 0.1;
      
      riskScore = Math.min(Math.max(riskScore, 0), 1); // Clamp between 0 and 1
      
      // Generate explanation
      let explanation = `Risk assessment based on: `;
      if (performance.length > 0) explanation += `recent performance trends, `;
      if (satisfaction.length > 0) explanation += `satisfaction scores, `;
      explanation += `tenure (${tenure.toFixed(1)} years)`;
      
      // Determine urgency level
      let urgencyLevel = 'Low';
      if (riskScore > 0.7) urgencyLevel = 'High';
      else if (riskScore > 0.4) urgencyLevel = 'Medium';

      // Update or create attrition risk record
      await UPSERT.into(AttritionRisk).entries({
        EmployeeID_ID: employeeId,
        RiskScore: riskScore,
        LastUpdated: new Date().toISOString(),
        Explanation: explanation,
        UrgencyLevel: urgencyLevel
      });
      
      return `Attrition risk calculated: ${(riskScore * 100).toFixed(1)}%`;
      
    } catch (error) {
      req.error(500, `Error generating attrition risk: ${error.message}`);
    }
  });
  
  // Action: Generate training recommendations
  this.on('generateTrainingRecommendations', async (req) => {
    const { employeeId } = req.data;
    
    try {
      const employee = await SELECT.one.from(Employees).where({ ID: employeeId });
      if (!employee) {
        req.error(404, `Employee with ID ${employeeId} not found`);
      }
      
      // Get recent performance data
      const performance = await SELECT.from(PerformanceMetrics)
        .where({ EmployeeID_ID: employeeId })
        .limit(1);
      
      // Simple recommendation logic (in real implementation, this would use ML)
      let recommendations = [];
      let confidenceScore = 0.7;
      
      if (performance.length > 0) {
        const latest = performance[0];
        if (latest.Score < 3.0) {
          recommendations.push("Performance improvement workshop");
          recommendations.push("Goal setting and time management training");
        }
        if (latest.GoalsMet < 70) {
          recommendations.push("Project management certification");
        }
      }
      
      // Role-based recommendations
      if (employee.Role.toLowerCase().includes('manager')) {
        recommendations.push("Leadership development program");
        recommendations.push("Team building workshop");
      }
      
      if (employee.Role.toLowerCase().includes('developer')) {
        recommendations.push("Technical skills advancement");
        recommendations.push("Code review best practices");
      }
      
      if (recommendations.length === 0) {
        recommendations.push("Professional development seminar");
        recommendations.push("Industry trends and innovation workshop");
        confidenceScore = 0.5;
      }
      
      const recommendationText = recommendations.join("; ");
      
      // Create training recommendation record
      const { uuid } = cds.utils;
      await INSERT.into(TrainingRecommendation).entries({
        ID: uuid(),
        EmployeeID_ID: employeeId,
        GeneratedDate: new Date().toISOString().split('T')[0],
        RecommendationText: recommendationText,
        ConfidenceScore: confidenceScore,
        Status: 'pending'
      });
      
      return `Training recommendations generated: ${recommendationText}`;
      
    } catch (error) {
      req.error(500, `Error generating training recommendations: ${error.message}`);
    }
  });
  
  // Action: Analyze team performance
  this.on('analyzeTeamPerformance', async (req) => {
    const { department } = req.data;
    
    try {
      // Get team members
      const teamMembers = await SELECT.from(Employees).where({ Department: department });
      
      if (teamMembers.length === 0) {
        return `No employees found in department: ${department}`;
      }
      
      // Get performance metrics for the team
      const teamIds = teamMembers.map(emp => emp.ID);
      const performanceData = await SELECT.from(PerformanceMetrics)
        .where({ EmployeeID_ID: { in: teamIds } });
      
      // Calculate team statistics
      const avgScore = performanceData.length > 0 
        ? performanceData.reduce((sum, p) => sum + p.Score, 0) / performanceData.length 
        : 0;
      
      const avgGoalsMet = performanceData.length > 0
        ? performanceData.reduce((sum, p) => sum + p.GoalsMet, 0) / performanceData.length
        : 0;
      
      const keyTalentCount = teamMembers.filter(emp => emp.IsKeyTalent).length;
      const keyTalentPercentage = (keyTalentCount / teamMembers.length) * 100;
      
      const analysis = `Team Performance Analysis for ${department}:
        - Team Size: ${teamMembers.length} employees
        - Average Performance Score: ${avgScore.toFixed(2)}/5.00
        - Average Goals Achievement: ${avgGoalsMet.toFixed(1)}%
        - Key Talent: ${keyTalentCount} (${keyTalentPercentage.toFixed(1)}%)
        - Performance Trend: ${avgScore >= 3.5 ? 'Strong' : avgScore >= 2.5 ? 'Moderate' : 'Needs Improvement'}`;
      
      return analysis;

    } catch (error) {
      req.error(500, `Error analyzing team performance: ${error.message}`);
    }
  });

  // Action: Generate engagement ideas for a department
  this.on('generateEngagementIdeas', async (req) => {
    const { department } = req.data;

    try {
      // Get department employees and their satisfaction data
      const employees = await SELECT.from(Employees).where({ Department: department });

      if (employees.length === 0) {
        return `No employees found in department: ${department}`;
      }

      const employeeIds = employees.map(emp => emp.ID);
      const satisfactionData = await SELECT.from(SatisfactionSurvey)
        .where({ EmployeeID_ID: { in: employeeIds } })
        .orderBy('SurveyDate desc');

      // Calculate average satisfaction
      const avgSatisfaction = satisfactionData.length > 0
        ? satisfactionData.reduce((sum, s) => sum + s.Score, 0) / satisfactionData.length
        : 50;

      // Generate engagement ideas based on satisfaction levels and department
      let ideas = [];
      let impactEstimate = 'Medium';

      if (avgSatisfaction < 50) {
        ideas = [
          'Implement flexible working hours to improve work-life balance',
          'Organize team building activities and social events',
          'Establish mentorship programs for career development',
          'Create recognition and rewards program for achievements'
        ];
        impactEstimate = 'High';
      } else if (avgSatisfaction < 70) {
        ideas = [
          'Launch innovation challenges and hackathons',
          'Provide professional development workshops',
          'Create cross-functional collaboration opportunities',
          'Implement employee feedback and suggestion system'
        ];
        impactEstimate = 'Medium';
      } else {
        ideas = [
          'Establish employee-led interest groups and clubs',
          'Create knowledge sharing sessions and lunch-and-learns',
          'Implement peer recognition programs',
          'Organize volunteer and community service opportunities'
        ];
        impactEstimate = 'Medium';
      }

      const ideaText = ideas.join('; ');

      // Store the engagement idea
      await INSERT.into(EngagementIdea).entries({
        ID: require('crypto').randomUUID(),
        Department: department,
        GeneratedDate: new Date().toISOString(),
        IdeaText: ideaText,
        ImpactEstimate: impactEstimate
      });

      return `Engagement ideas generated for ${department}: ${ideaText}`;

    } catch (error) {
      req.error(500, `Error generating engagement ideas: ${error.message}`);
    }
  });

  // Action: Analyze policy gaps and generate enhancement suggestions
  this.on('analyzePolicyGaps', async (req) => {
    try {
      // Analyze overall satisfaction and feedback patterns
      const allSatisfaction = await SELECT.from(SatisfactionSurvey)
        .orderBy('SurveyDate desc')
        .limit(100);

      const allFeedback = await SELECT.from(Feedback)
        .orderBy('Date desc')
        .limit(50);

      // Simple analysis based on satisfaction trends
      const avgSatisfaction = allSatisfaction.length > 0
        ? allSatisfaction.reduce((sum, s) => sum + s.Score, 0) / allSatisfaction.length
        : 50;

      let suggestions = [];
      let theme = '';
      let rationale = '';

      if (avgSatisfaction < 50) {
        theme = 'Employee Wellbeing and Retention';
        suggestions = [
          'Implement comprehensive mental health support programs',
          'Establish clear career progression pathways',
          'Create flexible work arrangement policies',
          'Develop conflict resolution and mediation procedures'
        ];
        rationale = 'Low satisfaction scores indicate need for fundamental policy improvements in employee support and career development.';
      } else if (avgSatisfaction < 70) {
        theme = 'Performance and Development';
        suggestions = [
          'Enhance performance review and feedback processes',
          'Implement skills development and training policies',
          'Create innovation and idea submission frameworks',
          'Establish cross-departmental collaboration guidelines'
        ];
        rationale = 'Moderate satisfaction suggests opportunities to enhance performance management and professional development policies.';
      } else {
        theme = 'Excellence and Innovation';
        suggestions = [
          'Develop leadership development and succession planning policies',
          'Create employee recognition and rewards frameworks',
          'Implement knowledge management and sharing policies',
          'Establish sustainability and social responsibility guidelines'
        ];
        rationale = 'High satisfaction provides foundation for advanced policies focused on excellence and innovation.';
      }

      const suggestionText = suggestions.join('; ');

      // Store the policy enhancement suggestion
      await INSERT.into(PolicyEnhancement).entries({
        ID: require('crypto').randomUUID(),
        GeneratedDate: new Date().toISOString(),
        Theme: theme,
        SuggestionText: suggestionText,
        Rationale: rationale
      });

      return `Policy enhancement analysis completed. Theme: ${theme}. Suggestions: ${suggestionText}`;

    } catch (error) {
      req.error(500, `Error analyzing policy gaps: ${error.message}`);
    }
  });

});
