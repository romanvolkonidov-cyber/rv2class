"use client";

import React, { Fragment } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Badge,
  Chip,
  Stack,
  Button as MuiButton,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { BookOpen, Loader2 } from "lucide-react";
import { HomeworkAssignment, HomeworkReport } from "@/lib/firebase";

interface HomeworkListProps {
  assignments: HomeworkAssignment[];
  loading: boolean;
  reports: HomeworkReport[];
  questionCounts: Record<string, { total: number; answered: number }>;
  onStartHomework: (assignmentId: string) => void;
  onViewResults: (assignment: HomeworkAssignment) => void;
  formatDate: (date: any) => string;
}

export default function HomeworkList({
  assignments,
  loading,
  reports,
  questionCounts,
  onStartHomework,
  onViewResults,
  formatDate,
}: HomeworkListProps) {
  const getReportForAssignment = (assignmentId: string) => {
    return reports.find(r => r.homeworkId === assignmentId);
  };

  const getStatusInfo = (assignment: HomeworkAssignment) => {
    const report = getReportForAssignment(assignment.id);
    if (report || assignment.status === "completed") {
      return { status: "completed" as const };
    }
    return { status: "pending" as const };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </Box>
    );
  }

  if (assignments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <BookOpen size={64} style={{ margin: '0 auto', color: '#6b7280' }} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          No homework assignments yet.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your teacher will assign homework for you to complete.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List>
        {assignments.map((assignment, index) => {
          const statusInfo = getStatusInfo(assignment);
          const report = getReportForAssignment(assignment.id);
          const questionInfo = questionCounts[assignment.id];
          const isCompleted = statusInfo.status === "completed";
          const displayTitle = assignment.topicName || assignment.chapterName || assignment.courseName || "Homework";
          
          const scoreChipLabel = report
            ? report.totalQuestions
              ? `${report.correctAnswers ?? 0}/${report.totalQuestions}`
              : typeof report.score === "number"
                ? `${report.score}%`
                : null
            : null;

          return (
            <Fragment key={assignment.id}>
              <ListItem
                alignItems="flex-start"
                sx={{ px: 0.5, py: 1.5 }}
                secondaryAction={
                  isCompleted ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      {scoreChipLabel && (
                        <Chip label={scoreChipLabel} size="small" sx={{ fontWeight: 600 }} />
                      )}
                      <MuiButton
                        variant="contained"
                        startIcon={<VisibilityIcon />}
                        onClick={() => onViewResults(assignment)}
                      >
                        View results
                      </MuiButton>
                    </Stack>
                  ) : (
                    <MuiButton
                      variant="outlined"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => onStartHomework(assignment.id)}
                    >
                      Start homework
                    </MuiButton>
                  )
                }
              >
                <ListItemAvatar>
                  <Badge
                    color="secondary"
                    overlap="circular"
                    badgeContent={
                      isCompleted ? <AssignmentIcon sx={{ fontSize: 16 }} /> : null
                    }
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {displayTitle.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 600 }}>
                      {displayTitle}
                    </Typography>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
                      <Typography component="span" variant="body2" color="text.secondary">
                        Assigned: {formatDate(assignment.assignedAt)}
                      </Typography>
                      {questionInfo && (
                        <Typography component="span" variant="body2" color="text.secondary">
                          • {questionInfo.total} question{questionInfo.total !== 1 ? 's' : ''}
                        </Typography>
                      )}
                      {isCompleted && (
                        <Typography component="span" variant="body2" sx={{ color: 'text.primary' }}>
                          — Completed
                        </Typography>
                      )}
                    </Stack>
                  }
                />
              </ListItem>
              {index < assignments.length - 1 && (
                <Divider component="li" sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
              )}
            </Fragment>
          );
        })}
      </List>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
        📝 Answer quiz questions to complete your homework and see your score
      </Typography>
    </Box>
  );
}
