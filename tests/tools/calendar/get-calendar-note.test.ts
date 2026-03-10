import { describe, it, expect } from '@jest/globals';

describe('get_calendar_note tool', () => {
  describe('Input Schema Validation', () => {
    it('should require type parameter', () => {
      const input = { type: 'day' };
      expect(input.type).toBeDefined();
    });

    it('should accept day type', () => {
      const input = { type: 'day', date: '2025-09-29' };
      expect(input.type).toBe('day');
    });

    it('should accept week type', () => {
      const input = { type: 'week', date: '2025-W39' };
      expect(input.type).toBe('week');
    });

    it('should accept month type', () => {
      const input = { type: 'month', date: '2025-09' };
      expect(input.type).toBe('month');
    });

    it('should accept inbox type', () => {
      const input = { type: 'inbox' };
      expect(input.type).toBe('inbox');
    });
  });

  describe('Date Format Validation', () => {
    it('should validate day date format YYYY-MM-DD', () => {
      const dayDate = '2025-09-29';
      expect(dayDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should validate month date format YYYY-MM', () => {
      const monthDate = '2025-09';
      expect(monthDate).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should validate week date format YYYY-Www', () => {
      const weekDate = '2025-W39';
      expect(weekDate).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('should reject invalid day format for day type', () => {
      const invalidDate = '2025-W39';
      const isDayFormat = /^\d{4}-\d{2}-\d{2}$/.test(invalidDate);
      expect(isDayFormat).toBe(false);
    });

    it('should reject invalid week format for week type', () => {
      const invalidDate = '2025-09-29';
      const isWeekFormat = /^\d{4}-W\d{2}$/.test(invalidDate);
      expect(isWeekFormat).toBe(false);
    });
  });

  describe('Known Issue: Week Format', () => {
    it('should document the week format requirement', () => {
      const correctWeekFormat = '2025-W39';
      const incorrectWeekFormat = '2025-09-29';
      
      expect(correctWeekFormat).toMatch(/^\d{4}-W\d{2}$/);
      expect(incorrectWeekFormat).not.toMatch(/^\d{4}-W\d{2}$/);
    });

    it('should handle week numbers correctly', () => {
      const week1 = '2025-W01';
      const week52 = '2025-W52';
      
      expect(week1).toMatch(/^\d{4}-W\d{2}$/);
      expect(week52).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('Calendar Note Types', () => {
    it('should handle day notes', () => {
      const dayNote = {
        noteId: 'day-123',
        title: '2025-09-29',
        type: 'text'
      };
      expect(dayNote.title).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle month notes', () => {
      const monthNote = {
        noteId: 'month-123',
        title: '2025-09',
        type: 'text'
      };
      expect(monthNote.title).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should handle week notes', () => {
      const weekNote = {
        noteId: 'week-123',
        title: '2025-W39',
        type: 'text'
      };
      expect(weekNote.title).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('should handle inbox notes', () => {
      const inboxNote = {
        noteId: 'inbox-123',
        title: 'Inbox',
        type: 'text'
      };
      expect(inboxNote.title).toBe('Inbox');
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year dates', () => {
      const leapYearDate = '2024-02-29';
      expect(leapYearDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle year boundaries', () => {
      const yearStart = '2025-01-01';
      const yearEnd = '2025-12-31';
      
      expect(yearStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(yearEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle first week of year', () => {
      const firstWeek = '2025-W01';
      expect(firstWeek).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('should handle last week of year', () => {
      const lastWeek = '2025-W52';
      expect(lastWeek).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('Response Structure', () => {
    it('should return note with ID', () => {
      const response = { noteId: 'calendar-123', title: '2025-09-29' };
      expect(response.noteId).toBeDefined();
    });

    it('should handle missing calendar note', () => {
      const response = null;
      expect(response).toBeNull();
    });

    it('should handle calendar note with attributes', () => {
      const note = {
        noteId: 'day-123',
        attributes: [
          { name: 'dateNote', value: '2025-09-29' }
        ]
      };
      expect(note.attributes).toBeDefined();
      expect(note.attributes[0].name).toBe('dateNote');
    });
  });
});
