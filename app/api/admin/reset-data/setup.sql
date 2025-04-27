-- Create stored procedure for deleting all properties
CREATE OR REPLACE FUNCTION delete_all_properties()
RETURNS void AS $$
BEGIN
    DELETE FROM properties WHERE id != 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to execute arbitrary SQL (use with caution!)
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS void AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to the anon role
GRANT EXECUTE ON FUNCTION delete_all_properties() TO anon;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon;
