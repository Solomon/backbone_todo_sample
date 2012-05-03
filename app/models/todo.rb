class Todo < ActiveRecord::Base
  attr_accessible :content, :done, :order

  def to_json(options = {})
    super(options.merge(:only => [ :id, :content, :order, :done ]))
  end
end
