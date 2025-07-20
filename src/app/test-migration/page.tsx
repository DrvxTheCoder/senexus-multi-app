// Create this as: src/app/test-migration/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TestResult {
  table: string;
  status: 'success' | 'error' | 'loading';
  count?: number;
  error?: string;
  sampleData?: any[];
}

export default function MigrationTestPage() {
  const [results, setResults] = useState<TestResult[]>([
    { table: 'senexus_groups', status: 'loading' },
    { table: 'firms', status: 'loading' },
    { table: 'profiles', status: 'loading' }
  ]);

  useEffect(() => {
    async function testTables() {
      const supabase = createClient();
      const newResults: TestResult[] = [];

      // Test each table
      const tables = ['senexus_groups', 'firms', 'profiles'];

      for (const table of tables) {
        try {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .limit(3);

          if (error) {
            newResults.push({
              table,
              status: 'error',
              error: error.message
            });
          } else {
            newResults.push({
              table,
              status: 'success',
              count: count || 0,
              sampleData: data || []
            });
          }
        } catch (err) {
          newResults.push({
            table,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      setResults(newResults);
    }

    testTables();
  }, []);

  return (
    <div className='mx-auto max-w-6xl p-8'>
      <div className='mb-8'>
        <h1 className='mb-2 text-3xl font-bold'>Migration Verification Test</h1>
        <p className='text-gray-600'>
          Testing if your manually created tables are working correctly.
        </p>
      </div>

      <div className='space-y-6'>
        {results.map((result) => (
          <div
            key={result.table}
            className={`rounded-lg border p-6 ${
              result.status === 'loading'
                ? 'border-blue-200 bg-blue-50'
                : result.status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
            }`}
          >
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-semibold capitalize'>
                {result.table.replace('_', ' ')} Table
              </h2>
              <div className='flex items-center space-x-2'>
                {result.status === 'loading' && (
                  <>
                    <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600'></div>
                    <span className='text-blue-600'>Testing...</span>
                  </>
                )}
                {result.status === 'success' && (
                  <>
                    <span className='text-2xl text-green-600'>✅</span>
                    <span className='font-medium text-green-600'>
                      {result.count} record{result.count !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
                {result.status === 'error' && (
                  <>
                    <span className='text-2xl text-red-600'>❌</span>
                    <span className='font-medium text-red-600'>Error</span>
                  </>
                )}
              </div>
            </div>

            {result.status === 'error' && (
              <div className='rounded bg-red-100 p-3 text-red-700'>
                <strong>Error:</strong> {result.error}
              </div>
            )}

            {result.status === 'success' &&
              result.sampleData &&
              result.sampleData.length > 0 && (
                <div className='space-y-3'>
                  <h3 className='font-medium text-gray-700'>Sample Data:</h3>
                  {result.sampleData.map((item, index) => (
                    <div key={index} className='rounded border bg-white p-3'>
                      <pre className='overflow-x-auto text-xs'>
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

            {result.status === 'success' && result.count === 0 && (
              <div className='rounded bg-gray-100 p-3 text-gray-600'>
                Table exists but contains no data yet.
              </div>
            )}
          </div>
        ))}
      </div>

      {results.every((r) => r.status === 'success') && (
        <div className='mt-8 rounded-lg border border-green-200 bg-green-50 p-6'>
          <h2 className='mb-2 text-xl font-semibold text-green-800'>
            🎉 Migration Successful!
          </h2>
          <p className='mb-4 text-green-700'>
            All tables were created successfully and are accessible from your
            application.
          </p>

          <div className='space-y-2 text-sm'>
            <h3 className='font-medium text-green-800'>Next Steps:</h3>
            <ul className='list-inside list-disc space-y-1 text-green-700'>
              <li>Your database schema is ready</li>
              <li>You can start building your application features</li>
              <li>
                Consider setting up authentication to populate the profiles
                table
              </li>
              <li>Test creating/updating records through your application</li>
            </ul>
          </div>
        </div>
      )}

      <div className='mt-8 rounded-lg bg-gray-50 p-4'>
        <h3 className='mb-2 font-semibold'>Environment Info:</h3>
        <div className='space-y-1 text-sm'>
          <p>
            <strong>Supabase URL:</strong>{' '}
            <code>{process.env.NEXT_PUBLIC_SUPABASE_URL}</code>
          </p>
          <p>
            <strong>Anon Key:</strong>{' '}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? '✅ Set'
              : '❌ Not set'}
          </p>
        </div>
      </div>
    </div>
  );
}
