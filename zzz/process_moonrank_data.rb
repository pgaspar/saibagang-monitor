require "json"

data = {}

File.open(File.join(File.dirname(__FILE__), "./moonrank-info.json")) do |info_file|
  data = JSON.parse info_file.read
end

processed_data = data["mints"].map do |m|
  id = m["name"].match(/\d+/).to_s
  rank = m["rank"]

  [id, rank]
end

processed_data.sort_by! { |a, b| a.to_i }

processed_json = JSON.pretty_generate(processed_data.to_h)

File.open(File.join(File.dirname(__FILE__), "./moonrank.json"), "w") do |moonrank_file|
  moonrank_file.write processed_json
end
