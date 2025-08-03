const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  const { Employees, SatisfactionSurvey, Feedback, PerformanceMetrics, AttritionRisk, OpenPositions, EngagementIdea, PolicyEnhancement } = this.entities;

  // Validation: Prevent self-feedback
  this.before('CREATE', 'Feedback', async (req) => {
    const { EmployeeID, FromUserID } = req.data;
    if (EmployeeID === FromUserID) {
      req.error(400, 'Employees cannot provide feedback about themselves');
    }
  });

  // Validation: Score range for satisfaction surveys
  this.before(['CREATE', 'UPDATE'], 'SatisfactionSurvey', async (req) => {
    const { Score } = req.data;
    if (Score < 0 || Score > 100) {
      req.error(400, 'Satisfaction score must be between 0 and 100');
    }
  });

  // Validation: Performance completion rate
  this.before(['CREATE', 'UPDATE'], 'PerformanceMetrics', async (req) => {
    const { ObjectiveCompletionRate } = req.data;
    if (ObjectiveCompletionRate < 0 || ObjectiveCompletionRate > 100) {
      req.error(400, 'Objective completion rate must be between 0 and 100');
    }
  });

  // Auto-calculate tenure when creating/updating employees
  this.before(['CREATE', 'UPDATE'], 'Employees', async (req) => {
    if (req.data.HireDate) {
      const hireDate = new Date(req.data.HireDate);
      const now = new Date();
      const diffTime = Math.abs(now - hireDate);
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
      req.data.TenureMonths = diffMonths;
    }
  });

  // AI Action: Generate attrition risk
  this.on('generateAttritionRisk', async (req) => {
    const { employeeId } = req.data;
    
    try {
      // Get employee data
      const employee = await SELECT.one.from(Employees).where({ ID: employeeId });
      if (!employee) {
        return { success: false, message: 'Employee not found', riskScore: 0 };
      }

      // Get recent satisfaction scores
      const recentSurveys = await SELECT.from(SatisfactionSurvey)
        .where({ EmployeeID: employeeId })
        .orderBy('SurveyDate desc')
        .limit(3);

      // Get performance metrics
      const recentPerformance = await SELECT.from(PerformanceMetrics)
        .where({ EmployeeID: employeeId })
        .orderBy('Period desc')
        .limit(2);

      // Calculate risk score based on multiple factors
      let riskScore = 0;
      let factors = [];

      // Factor 1: Satisfaction trend
      if (recentSurveys.length > 0) {
        const avgSatisfaction = recentSurveys.reduce((sum, s) => sum + s.Score, 0) / recentSurveys.length;
        if (avgSatisfaction < 50) {
          riskScore += 0.4;
          factors.push('Low satisfaction scores');
        } else if (avgSatisfaction < 70) {
          riskScore += 0.2;
          factors.push('Moderate satisfaction concerns');
        }
      }

      // Factor 2: Performance trend
      if (recentPerformance.length >= 2) {
        const latest = recentPerformance[0].ObjectiveCompletionRate;
        const previous = recentPerformance[1].ObjectiveCompletionRate;
        if (latest < previous - 10) {
          riskScore += 0.3;
          factors.push('Declining performance');
        }
      }

      // Factor 3: Tenure (higher risk for very new or very long tenure)
      if (employee.TenureMonths < 6) {
        riskScore += 0.2;
        factors.push('New employee adjustment period');
      } else if (employee.TenureMonths > 60) {
        riskScore += 0.1;
        factors.push('Long tenure - potential stagnation');
      }

      // Cap at 1.0
      riskScore = Math.min(riskScore, 1.0);

      // Determine urgency level
      let urgencyLevel = 'Low';
      if (riskScore > 0.7) urgencyLevel = 'High';
      else if (riskScore > 0.4) urgencyLevel = 'Medium';

      // Save or update attrition risk
      const explanation = factors.length > 0 ? factors.join('; ') : 'No significant risk factors identified';
      
      await UPSERT.into(AttritionRisk).entries({
        EmployeeID: employeeId,
        RiskScore: riskScore,
        LastUpdated: new Date().toISOString(),
        Explanation: explanation,
        UrgencyLevel: urgencyLevel
      });

      return {
        success: true,
        message: `Attrition risk calculated: ${urgencyLevel} (${Math.round(riskScore * 100)}%)`,
        riskScore: riskScore
      };

    } catch (error) {
      console.error('Error generating attrition risk:', error);
      return { success: false, message: 'Error calculating attrition risk', riskScore: 0 };
    }
  });



  // AI Action: Analyze team performance
  this.on('analyzeTeamPerformance', async (req) => {
    const { department } = req.data;
    
    try {
      // Get all employees in department
      const employees = await SELECT.from(Employees).where({ Department: department });
      
      if (employees.length === 0) {
        return { success: false, analysis: null };
      }

      // Get performance metrics for all employees
      const employeeIds = employees.map(e => e.ID);
      const performanceData = await SELECT.from(PerformanceMetrics)
        .where({ EmployeeID: { in: employeeIds } })
        .orderBy('Period desc');

      // Calculate average completion rate
      const avgCompletion = performanceData.length > 0 
        ? performanceData.reduce((sum, p) => sum + p.ObjectiveCompletionRate, 0) / performanceData.length
        : 0;

      // Identify top performers (>80% completion)
      const topPerformers = [];
      const performanceByEmployee = {};
      
      performanceData.forEach(p => {
        if (!performanceByEmployee[p.EmployeeID]) {
          performanceByEmployee[p.EmployeeID] = [];
        }
        performanceByEmployee[p.EmployeeID].push(p.ObjectiveCompletionRate);
      });

      employees.forEach(emp => {
        const empPerformance = performanceByEmployee[emp.ID] || [];
        if (empPerformance.length > 0) {
          const empAvg = empPerformance.reduce((sum, p) => sum + p, 0) / empPerformance.length;
          if (empAvg > 80) {
            topPerformers.push(`${emp.FirstName} ${emp.LastName}`);
          }
        }
      });

      // Identify improvement areas
      const improvementAreas = [];
      if (avgCompletion < 70) {
        improvementAreas.push('Overall objective completion needs improvement');
      }
      if (topPerformers.length / employees.length < 0.3) {
        improvementAreas.push('Limited high performers - consider mentoring programs');
      }
      if (performanceData.length < employees.length * 0.5) {
        improvementAreas.push('Insufficient performance data - improve tracking');
      }

      return {
        success: true,
        analysis: {
          avgCompletion: Math.round(avgCompletion * 100) / 100,
          topPerformers: topPerformers,
          improvementAreas: improvementAreas
        }
      };

    } catch (error) {
      console.error('Error analyzing team performance:', error);
      return { success: false, analysis: null };
    }
  });

});
