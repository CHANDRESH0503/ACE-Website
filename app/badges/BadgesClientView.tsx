"use client";
import { PageHeader } from "@/components/layout/page-header";
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Tables } from '@/lib/supabase/database.types';

type Badge = Tables<'Badge'> & {
  publicIconUrl: string | null;
};

const AnimatedBadgeItem = ({ badge }: { badge: Badge }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="h-full">
      <Link href={`/badges/${badge.id}`} passHref>
        <Card className="group h-full flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer border border-border/40 hover:border-primary/60">
          <CardHeader className="p-0 items-center justify-center aspect-[4/3] relative overflow-hidden bg-muted/30">
            {badge.publicIconUrl ? (
              <Image
                src={badge.publicIconUrl}
                alt={`${badge.name} badge icon`}
                fill
                className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                <span className="text-muted-foreground text-base">No Icon</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-5 flex flex-col flex-grow bg-card">
            <CardTitle className="text-xl font-semibold mb-2 truncate group-hover:text-primary transition-colors" title={badge.name ?? 'Badge Name'}>
              {badge.name ?? 'Badge Name'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow" title={badge.description ?? 'Badge description'}>
              {badge.description ?? 'Badge description'}
            </CardDescription>
            <div className="mt-auto pt-3 flex justify-start items-center border-t border-border/20">
              {badge.type && badge.type !== 'MANUAL' && (
                <UiBadge variant={badge.type === 'AUTOMATIC' ? 'outline' : 'default'} className="capitalize text-xs px-2.5 py-1">
                  {badge.type.toLowerCase().replace('_', ' ')}
                </UiBadge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default function BadgesClientView({ badges }: { badges: Badge[] }) {
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.4,
        staggerChildren: 0.15,
        when: "beforeChildren"
      },
    },
  };

  const noItemsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5 } },
  };

  return (
    <motion.div
      className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 sm:pb-36"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <PageHeader title="Badges" description="Badges you can earn through ACE events and showcase on your public profile." />

      {badges && badges.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {badges.map((badge) => (
            <AnimatedBadgeItem key={badge.id} badge={badge} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-20"
          initial="hidden"
          animate="visible"
          variants={noItemsVariants}
        >
          <p className="text-2xl font-semibold text-muted-foreground mb-4">No Badges Found</p>
          <p className="text-md text-muted-foreground">Start your journey to earn them!</p>
        </motion.div>
      )}
    </motion.div>
  );
}
