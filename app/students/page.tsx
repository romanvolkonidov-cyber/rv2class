"use client";

import { useEffect, useState } from "react";
import { fetchStudents, Student, updateStudentTag } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Link as LinkIcon, UserCheck, ExternalLink, Copy, Check, Tag, ChevronDown, ChevronRight, X, UserMinus } from "lucide-react";

const TAG_COLORS = {
  red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-300", dot: "bg-red-500" },
  orange: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-800 dark:text-orange-300", dot: "bg-orange-500" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-300", dot: "bg-yellow-500" },
  green: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-300", dot: "bg-green-500" },
  blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-300", dot: "bg-blue-500" },
  purple: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-300", dot: "bg-purple-500" },
  pink: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-800 dark:text-pink-300", dot: "bg-pink-500" },
  gray: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-800 dark:text-gray-300", dot: "bg-gray-500" },
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingTag, setUpdatingTag] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const origin = typeof window === "undefined" ? "https://online.rv2class.com" : window.location.origin;

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateJoinLink = (student: Student) => {
    // Link to student's personal welcome page
    return `${origin}/student/${student.id}`;
  };

  const generateTagLink = (tagColor: string) => {
    // Link to tag-based student selector
    return `${origin}/student/tag/${tagColor}`;
  };

  const copyToClipboard = async (text: string, studentId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(studentId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleTagChange = async (studentId: string, newTag: string | null) => {
    setUpdatingTag(studentId);
    try {
      const success = await updateStudentTag(studentId, newTag);
      if (success) {
        // Reload students to reflect changes
        await loadStudents();
      }
    } catch (error) {
      console.error("Failed to update tag:", error);
    } finally {
      setUpdatingTag(null);
    }
  };

  const toggleGroupExpanded = (color: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(color)) {
        newSet.delete(color);
      } else {
        newSet.add(color);
      }
      return newSet;
    });
  };

  const removeAllFromGroup = async (color: string) => {
    if (!confirm(`Remove all students from the ${color} group?`)) return;
    
    const studentsInGroup = students.filter(s => s.tag === color);
    setUpdatingTag('bulk-' + color);
    
    try {
      await Promise.all(
        studentsInGroup.map(student => updateStudentTag(student.id, null))
      );
      await loadStudents();
    } catch (error) {
      console.error("Failed to remove students from group:", error);
    } finally {
      setUpdatingTag(null);
    }
  };

  const getTeacherBadgeColor = (teacher?: string) => {
    switch (teacher?.toLowerCase()) {
      case "roman":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "violet":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const studentsByTeacher = {
    Roman: students.filter((s) => s.teacher?.toLowerCase() === "roman"),
    Violet: students.filter((s) => s.teacher?.toLowerCase() === "violet"),
    Unassigned: students.filter((s) => !s.teacher || s.teacher === "unassigned"),
  };

  // Group students by tag color
  const studentsByTag = Object.keys(TAG_COLORS).reduce((acc, color) => {
    const taggedStudents = students.filter((s) => s.tag === color);
    if (taggedStudents.length > 0) {
      acc[color] = taggedStudents;
    }
    return acc;
  }, {} as Record<string, Student[]>);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
            <Users className="h-10 w-10 text-blue-600" />
            Students
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            All registered students with their personalized welcome pages
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : students.length === 0 ? (
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No students found. Add students via Student Management.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Tag-based Groups */}
            {Object.keys(studentsByTag).length > 0 && (
              <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-2 border-blue-300 dark:border-blue-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-6 w-6 text-blue-600" />
                    Color Groups
                  </CardTitle>
                  <CardDescription>
                    Click on a group to expand and see all students. You can remove students or delete entire groups.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(studentsByTag).map(([color, tagStudents]) => {
                      const tagLink = generateTagLink(color);
                      const colorScheme = TAG_COLORS[color as keyof typeof TAG_COLORS];
                      const isCopied = copiedId === `tag-${color}`;
                      const isExpanded = expandedGroups.has(color);
                      const isRemoving = updatingTag === 'bulk-' + color;
                      
                      return (
                        <div key={color} className={`border-2 rounded-lg ${colorScheme.bg} border-gray-300 dark:border-gray-600`}>
                          {/* Group Header */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleGroupExpanded(color)}
                                className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                )}
                                <div className={`w-4 h-4 rounded-full ${colorScheme.dot}`}></div>
                                <span className={`font-semibold capitalize text-lg ${colorScheme.text}`}>
                                  {color} Group
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  ({tagStudents.length} {tagStudents.length === 1 ? "student" : "students"})
                                </span>
                              </button>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(tagLink, `tag-${color}`)}
                                  className="flex items-center gap-1"
                                  title="Copy group link"
                                >
                                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  <span className="hidden sm:inline">Link</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(tagLink, "_blank")}
                                  className="flex items-center gap-1"
                                  title="Open group page"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="hidden sm:inline">Open</span>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeAllFromGroup(color)}
                                  disabled={isRemoving}
                                  className="flex items-center gap-1"
                                  title="Remove all students from group"
                                >
                                  {isRemoving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                  <span className="hidden sm:inline">Delete Group</span>
                                </Button>
                              </div>
                            </div>
                            
                            {/* Expanded Student List */}
                            {isExpanded && (
                              <div className="mt-4 space-y-2 pl-8">
                                {tagStudents.map((student) => {
                                  const isUpdating = updatingTag === student.id;
                                  
                                  return (
                                    <div
                                      key={student.id}
                                      className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                      <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                          {student.name}
                                        </h4>
                                        {student.teacher && (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                            {student.teacher}
                                          </span>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleTagChange(student.id, null)}
                                        disabled={isUpdating}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        title="Remove from group"
                                      >
                                        {isUpdating ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <>
                                            <UserMinus className="h-4 w-4 mr-1" />
                                            Remove
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Students by Teacher */}
            {Object.entries(studentsByTeacher).map(([teacher, studentList]) => {
              if (studentList.length === 0) return null;
              
              return (
                <Card key={teacher} className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className={`h-6 w-6 ${teacher === "Roman" ? "text-blue-600" : teacher === "Violet" ? "text-purple-600" : "text-gray-600"}`} />
                      {teacher === "Unassigned" ? "Unassigned Students" : `${teacher}'s Students`}
                    </CardTitle>
                    <CardDescription>
                      {studentList.length} {studentList.length === 1 ? "student" : "students"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentList.map((student) => {
                        const joinLink = generateJoinLink(student);
                        const isCopied = copiedId === student.id;
                        
                        return (
                          <div
                            key={student.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {student.name}
                                </h3>
                                {student.tag && (
                                  <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${TAG_COLORS[student.tag].dot}`}></div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[student.tag].bg} ${TAG_COLORS[student.tag].text}`}>
                                      {student.tag}
                                    </span>
                                  </div>
                                )}
                                {student.teacher && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTeacherBadgeColor(student.teacher)}`}>
                                    {student.teacher}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <LinkIcon className="h-4 w-4" />
                                <span className="text-xs">Personal page:</span>
                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {joinLink}
                                </code>
                              </div>
                              {student.subjects && (
                                <div className="flex gap-2 mt-2">
                                  {student.subjects.English && (
                                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                      English
                                    </span>
                                  )}
                                  {student.subjects.IT && (
                                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                      IT
                                    </span>
                                  )}
                                </div>
                              )}
                              {/* Tag Selector */}
                              <div className="mt-2">
                                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                  Color Tag:
                                </label>
                                <div className="flex gap-1 flex-wrap">
                                  {Object.entries(TAG_COLORS).map(([color, colorScheme]) => (
                                    <button
                                      key={color}
                                      onClick={() => handleTagChange(student.id, student.tag === color ? null : color)}
                                      disabled={updatingTag === student.id}
                                      className={`w-6 h-6 rounded-full border-2 transition-all ${colorScheme.dot} ${
                                        student.tag === color 
                                          ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-1 ring-gray-900 dark:ring-white' 
                                          : 'border-gray-300 dark:border-gray-600 hover:scale-110'
                                      } ${updatingTag === student.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                      title={color}
                                    />
                                  ))}
                                  {student.tag && (
                                    <button
                                      onClick={() => handleTagChange(student.id, null)}
                                      disabled={updatingTag === student.id}
                                      className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 transition-all"
                                      title="Remove tag"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(joinLink, student.id)}
                                className="flex items-center gap-2"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copy Link
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => window.open(joinLink, "_blank")}
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="mr-2"
          >
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={loadStudents}
          >
            Refresh
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Students can click their personalized link to join with their name pre-filled</p>
        </div>
      </div>
    </main>
  );
}
