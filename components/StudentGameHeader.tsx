"use client";

import React from "react";
import {
  Box,
  Typography,
  Card as MuiCard,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Trophy,
  Star,
  Zap,
  Flame,
  ShoppingBag,
} from "lucide-react";
import {
  GameProfile,
  LevelInfo,
  ShopReward,
  Badge,
} from "@/lib/gamification";

interface StudentGameHeaderProps {
  gameProfile: GameProfile;
  level: LevelInfo;
  progress: { current: number; needed: number; percent: number };
  nextLevel: LevelInfo | null;
  nextShopUnlock: { reward: ShopReward | null; coinsNeeded: number } | null;
  nextBadgeHint: Badge | null;
  isOverdue: boolean;
}

export default function StudentGameHeader({
  gameProfile,
  level,
  progress,
  nextLevel,
  nextShopUnlock,
  nextBadgeHint,
  isOverdue,
}: StudentGameHeaderProps) {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Multipliers row */}
      <Box sx={{ 
        maxWidth: 980, 
        mx: 'auto', 
        mb: 4, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
          Мультипликаторы:
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="center">
          <Tooltip title={gameProfile.currentStreak >= 3 ? "Серия 3+ недель! Множитель 1.2x активен." : "Выполняй домашку 3 недели подряд для бонуса 1.2x!"}>
            <Chip 
              icon={<Flame size={14} color="white" fill={gameProfile.currentStreak >= 3 ? "white" : "transparent"} />}
              label="1.2x Серия"
              size="small"
              sx={{ 
                fontWeight: 800, 
                bgcolor: gameProfile.currentStreak >= 3 ? '#f59e0b' : '#e2e8f0',
                color: gameProfile.currentStreak >= 3 ? 'white' : '#94a3b8',
              }}
            />
          </Tooltip>
          <Tooltip title={!isOverdue ? "Все уроки в срок! Множитель 1.3x за скорость активен." : "У тебя есть долги старше 7 дней."}>
            <Chip 
              icon={<Zap size={14} color="white" fill={!isOverdue ? "white" : "transparent"} />}
              label="1.3x Скорость"
              size="small"
              sx={{ 
                fontWeight: 800, 
                bgcolor: !isOverdue ? '#10b981' : '#e2e8f0',
                color: !isOverdue ? 'white' : '#94a3b8',
              }}
            />
          </Tooltip>
          <Tooltip title={[0,6].includes(new Date().getDay()) ? "Бонус выходного дня 1.5x активен!" : "Выполняй задания в Сб или Вс."}>
            <Chip 
              icon={<Star size={14} color="white" fill={[0,6].includes(new Date().getDay()) ? "white" : "transparent"} />}
              label="1.5x Выходной"
              size="small"
              sx={{ 
                fontWeight: 800, 
                bgcolor: [0,6].includes(new Date().getDay()) ? '#ec4899' : '#e2e8f0',
                color: [0,6].includes(new Date().getDay()) ? 'white' : '#94a3b8',
              }}
            />
          </Tooltip>
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} maxWidth={980} mx="auto">
        {/* XP & Level Card */}
        <MuiCard sx={{ 
          flex: 2, 
          p: {xs: 2, sm: 3}, 
          background: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(12px)', 
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h3">{level.emoji}</Typography>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 850 }}>Lv.{level.level} {level.title}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Текущий ранг</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2.5}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 850, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Flame size={20} fill="#f59e0b" /> {gameProfile.currentStreak}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Серия</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 850, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Zap size={20} fill="#3b82f6" /> {gameProfile.xp}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Всего XP</Typography>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ width: '100%', mb: 1 }}>
             <Box sx={{ position: 'relative', height: 12, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 6, overflow: 'hidden' }}>
               <Box sx={{ position: 'absolute', height: '100%', width: `${progress.percent}%`, background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: 6 }} />
             </Box>
             <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.75, fontWeight: 800, color: '#64748b' }}>
               {progress.needed > 0 ? `${progress.current} / ${progress.needed} XP до Lv.${level.level + 1}` : 'Максимальный уровень! 🎉'}
             </Typography>
          </Box>
        </MuiCard>

        {/* Next Goals Card */}
        <MuiCard sx={{ 
          flex: 1, 
          p: {xs: 2, sm: 3}, 
          background: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(12px)', 
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 2 }}>🎯 Следующая цель</Typography>
          <Stack spacing={1.25}>
            {nextLevel && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Trophy size={16} color="#3b82f6" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>До {nextLevel.emoji}: <strong>{nextLevel.xpRequired - gameProfile.xp} XP</strong></Typography>
              </Box>
            )}
            {nextShopUnlock?.reward && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ShoppingBag size={16} color="#f59e0b" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Награда {nextShopUnlock.reward.emoji}: {nextShopUnlock.coinsNeeded > 0 ? <strong>{nextShopUnlock.coinsNeeded} монеты</strong> : 'доступно!'}</Typography>
              </Box>
            )}
            {nextBadgeHint && (
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                <Star size={16} color="#ec4899" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{nextBadgeHint.emoji} {nextBadgeHint.name}</Typography>
              </Box>
            )}
          </Stack>
        </MuiCard>
      </Stack>
    </Box>
  );
}
